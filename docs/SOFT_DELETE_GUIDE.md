# Soft Delete System Guide

Система мягкого удаления позволяет удалять данные без потери истории и возможности восстановления.

## 🔍 Что это?

**Hard Delete (полное удаление):**
```sql
DELETE FROM profiles WHERE id = user_id  -- ❌ Запись исчезает ПОЛНОСТЬЮ
```

**Soft Delete (мягкое удаление):**
```sql
UPDATE profiles SET deleted_at = now() WHERE id = user_id  -- ✅ Запись помечена, но существует
```

## 📋 Какие таблицы используют soft delete?

| Таблица | Причина | Восстановление |
|---------|---------|------------|
| **profiles** | Пользователи удаляют акки, потом возвращаются | ✅ Можно восстановить |
| **tasks** | История заказов нужна для финансов | ✅ Полная история |
| **ratings** | История оценок для аудита | ✅ Видна удаленная оценка |
| **messages** | История чатов | ✅ Сообщения видны в логах |
| **feedback** | Обратная связь нужна для анализа | ✅ Историческое значение |

**transactions - НЕ УДАЛЯЮТСЯ НИКОГДА!** Только добавляются записи.

---

## 💻 Использование в коде

### 1. TypeScript - Сервис soft delete

```typescript
import {
  softDelete,
  restoreDeleted,
  getDeletionStats,
  getDeletedRecords,
  getDeletionHistory,
} from '@/lib/services/softDelete'

// ────────────────────────────────────────────

// Мягко удалить профиль
const result = await softDelete('profiles', userId)
if (result.success) {
  console.log('✅ Профиль удалён')
}

// Восстановить профиль
await restoreDeleted('profiles', userId)
console.log('✅ Профиль восстановлен')

// ────────────────────────────────────────────

// Получить статистику удалённых
const stats = await getDeletionStats('profiles')
console.log(`
  Всего профилей: ${stats.total}
  Активных: ${stats.active}
  Удалённых: ${stats.deleted} (${stats.deletionPercentage}%)
`)

// ────────────────────────────────────────────

// Получить список удалённых записей
const { data: deletedProfiles } = await getDeletedRecords('profiles', 100)
deletedProfiles.forEach((profile) => {
  console.log(`Удалён: ${profile.id} в ${profile.deleted_at}`)
})

// ────────────────────────────────────────────

// История удаления (с аудитом)
const { data: history } = await getDeletionHistory('profiles', userId)
history.forEach((log) => {
  if (log.changed_fields?.includes('deleted_at')) {
    console.log(`
      Удаление: ${log.created_at}
      Удалил: ${log.user_id}
      Было: ${log.old_values?.deleted_at}
      Стало: ${log.new_values?.deleted_at}
    `)
  }
})
```

### 2. API - REST endpoints

**Мягкое удаление через API:**

```bash
# Удалить профиль
curl -X POST http://localhost:3000/api/soft-delete \
  -H "Content-Type: application/json" \
  -d '{
    "action": "delete",
    "tableName": "profiles",
    "recordId": "user-123"
  }'

# Результат: { success: true, action: "delete" }
```

**Восстановление:**

```bash
curl -X POST http://localhost:3000/api/soft-delete \
  -H "Content-Type: application/json" \
  -d '{
    "action": "restore",
    "tableName": "profiles",
    "recordId": "user-123"
  }'
```

**Получить статистику:**

```bash
curl "http://localhost:3000/api/soft-delete?action=stats&table=profiles"

# Результат:
# {
#   "table": "profiles",
#   "total": 500,
#   "active": 480,
#   "deleted": 20,
#   "deletionPercentage": "4.00"
# }
```

**Список удалённых записей:**

```bash
curl "http://localhost:3000/api/soft-delete?action=deleted-records&table=profiles&limit=50"
```

**Проверить удалена ли запись:**

```bash
curl "http://localhost:3000/api/soft-delete?action=check&table=profiles&record_id=user-123"

# Результат: { "recordId": "user-123", "deleted": false, "tableName": "profiles" }
```

---

## 🔐 Безопасность - RLS Политики

Удалённые записи **автоматически скрыты** благодаря RLS политикам:

```sql
-- Для каждой таблицы добавлена политика:
CREATE POLICY "Hide deleted records" ON profiles
  FOR SELECT
  USING (deleted_at IS NULL);
```

**Что это означает:**
- ✅ Обычные запросы не видят удалённые записи
- ✅ Суперпользователь (с service_role) может видеть всё
- ✅ RLS работает автоматически, не нужно писать условия

```typescript
// ❌ Это НЕ покажет удалённые профили (RLS скроет)
const { data } = await supabase
  .from('profiles')
  .select('*')

// ✅ Это покажет удалённые профили (используется service_role в сервисе)
const { data } = await getDeletedRecords('profiles', 100)
```

---

## 📊 Интеграция с Audit Log

**Важно:** Soft delete автоматически логируется в `audit_log`!

Когда вы вызываете `softDelete()`, в БД происходит UPDATE:
```sql
UPDATE profiles SET deleted_at = now() WHERE id = ...
```

Это триггирует `audit_trigger_func()` и создаёт запись:

```json
{
  "table_name": "profiles",
  "record_id": "user-123",
  "operation": "UPDATE",
  "user_id": "admin-456",
  "old_values": { "deleted_at": null },
  "new_values": { "deleted_at": "2026-05-05T15:30:00Z" },
  "changed_fields": ["deleted_at"],
  "created_at": "2026-05-05T15:30:00Z"
}
```

**Полная история удаления и восстановления видна в audit_log!**

---

## 🗂️ Views для удобства

Автоматически созданы VIEW'ы для простого доступа к активным записям:

```typescript
// Вместо: SELECT * FROM profiles WHERE deleted_at IS NULL
// Можно использовать view:

const { data: activeProfiles } = await supabase
  .from('profiles_active')  // Это VIEW
  .select('*')
```

**Доступные views:**
- `profiles_active` - активные профили
- `tasks_active` - активные задачи
- `ratings_active` - активные рейтинги
- `messages_active` - активные сообщения
- `feedback_active` - активная обратная связь

---

## 🧹 Cleanup - Удаление старых данных

Для GDPR и освобождения места можно удалить очень старые данные:

```typescript
// Удалить записи которые были удалены более 90 дней назад
const result = await cleanupOldDeletedRecords('profiles', 90)

console.log(`Удалено: ${result.deleted} записей`)
```

---

## ⚠️ Сценарии использования

### Сценарий 1: Пользователь удаляет аккаунт

```typescript
// User clicks "Delete account"
await softDelete('profiles', userId)

// Профиль помечен как deleted_at = now()
// Пользователь больше не видит его
// Но данные остаются в БД

// Если он захочет восстановить:
await restoreDeleted('profiles', userId)
// deleted_at = NULL
// Профиль видим снова
```

### Сценарий 2: Администратор удаляет спамовый отзыв

```typescript
// Admin view: List all ratings
const { data: deletedRatings } = await getDeletedRecords('ratings', 100)

deletedRatings.forEach(async (rating) => {
  // После 30 дней - окончательно удалить
  if (daysOld(rating.deleted_at) > 30) {
    await permanentlyDelete('ratings', rating.id)
  }
})
```

### Сценарий 3: Система очистки данных

```typescript
// Cron job для GDPR compliance
async function gdprCleanup() {
  const tables = ['profiles', 'tasks', 'ratings', 'messages', 'feedback']
  
  for (const table of tables) {
    // Удалить данные которые удалены более 2 лет
    const result = await cleanupOldDeletedRecords(table, 730)
    console.log(`${table}: очищено ${result.deleted} записей`)
  }
}
```

---

## 🆘 Troubleshooting

### Проблема: Удалённые записи всё ещё видны

**Причина:** RLS не применена или запрос идёт как service_role

**Решение:**
```typescript
// ❌ Неправильно - видит всё включая удалённое
const { data } = await supabase
  .from('profiles')
  .select('*')

// ✅ Правильно - RLS скроет удалённое
// Благодаря RLS политике автоматически
```

### Проблема: Нельзя восстановить удалённую запись

**Причина:** Данные были полностью удалены (hard delete)

**Решение:** Используй soft delete вместо DELETE

```typescript
// ❌ Избегать
await supabase.from('profiles').delete().eq('id', userId)

// ✅ Использовать
await softDelete('profiles', userId)
```

### Проблема: Нужна история WHO удалил запись

**Решение:** Используй audit_log

```typescript
const { data: history } = await getDeletionHistory('profiles', userId)

history.forEach((log) => {
  if (log.changed_fields?.includes('deleted_at')) {
    console.log(`
      Удалил: ${log.user_id}
      Когда: ${log.created_at}
      Был deleted_at: ${log.old_values?.deleted_at}
      Стал deleted_at: ${log.new_values?.deleted_at}
    `)
  }
})
```

---

## 📈 Best Practices

✅ **ДЕЛАЙ:**
- Используй soft delete для всех пользовательских данных
- Храни deleted_at для истории
- Проверяй аудит перед восстановлением
- Очищай очень старые данные для GDPR

❌ **НЕ ДЕЛАЙ:**
- Не используй hard delete (DELETE) для критичных данных
- Не забывай про RLS политики
- Не показывай удалённые данные обычным пользователям
- Не удаляй финансовые записи (только добавляй)

---

## 📞 API Reference

| Функция | Описание | Сложность |
|---------|---------|-----------|
| `softDelete(table, id)` | Мягкое удаление | ⭐ Easy |
| `restoreDeleted(table, id)` | Восстановление | ⭐ Easy |
| `isDeleted(table, id)` | Проверка удалена ли | ⭐ Easy |
| `getDeletedRecords(table, limit)` | Список удалённых | ⭐ Easy |
| `getDeletionHistory(table, id)` | История (с аудитом) | ⭐⭐ Medium |
| `getDeletionStats(table)` | Статистика | ⭐ Easy |
| `bulkSoftDelete(table, ids)` | Массовое удаление | ⭐⭐ Medium |
| `bulkRestore(table, ids)` | Массовое восстановление | ⭐⭐ Medium |
| `permanentlyDelete(table, id)` | Окончательное удаление | ⭐⭐⭐ Hard |
| `cleanupOldDeletedRecords(table, days)` | GDPR cleanup | ⭐⭐⭐ Hard |

---

**Last updated:** 2026-05-05

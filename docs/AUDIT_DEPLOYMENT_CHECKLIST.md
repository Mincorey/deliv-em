# Audit Log System - Deployment Checklist

## 📋 Что было создано

### 1. ✅ SQL Миграция
- **Файл:** `supabase/migrations/10_create_audit_log.sql`
- **Включает:**
  - Таблица `audit_log` с оптимальной структурой
  - Индексы для быстрого поиска
  - PL/pgSQL функция `audit_trigger_func()` для логирования
  - Триггеры на таблицы: `transactions`, `ratings`, `tasks`, `profiles`
  - RLS политики для безопасности
  - Полезные VIEW'ы для запросов

### 2. ✅ TypeScript Сервис
- **Файл:** `lib/services/audit.ts`
- **Функции:**
  - `getAuditLog()` - получить логи с фильтрацией
  - `getRecordAuditTrail()` - история конкретной записи
  - `getUserAuditActivity()` - действия пользователя
  - `getTableAuditLog()` - все изменения в таблице
  - `getChangeDetails()` -详細 о чём именно изменилось
  - `describeChange()` - человекочитаемое описание
  - `getAuditStatistics()` - статистика изменений

### 3. ✅ API Маршрут
- **Файл:** `app/api/audit/route.ts`
- **Endpoints:**
  - `GET /api/audit?type=all` - все логи
  - `GET /api/audit?type=record&table=transactions&record_id=xxx` - история записи
  - `GET /api/audit?type=user&user_id=xxx` - действия пользователя
  - `GET /api/audit?type=table&table=transactions` - логи таблицы
  - `GET /api/audit?type=stats&table=transactions` - статистика

### 4. ✅ Документация
- **AUDIT_LOG_GUIDE.md** - подробное руководство с примерами
- **README.md** - обновлена с информацией об audit_log

---

## 🚀 Как развернуть

### Шаг 1: Применить миграцию в Supabase

**Вариант A: Через Supabase Dashboard**
1. Зайди в [Supabase Console](https://app.supabase.com)
2. Выбери проект delivem
3. Перейди в `SQL Editor`
4. Скопируй содержимое `supabase/migrations/10_create_audit_log.sql`
5. Запусти SQL запрос

**Вариант B: Через Supabase CLI (рекомендуется)**
```bash
# Установить Supabase CLI если ещё не установлен
npm install -g supabase

# Войти в аккаунт
supabase login

# Применить миграцию
supabase db push
```

### Шаг 2: Проверить что всё создалось

```sql
-- Проверить что таблица создана
SELECT COUNT(*) FROM audit_log;

-- Проверить что функция создана
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'audit_trigger_func';

-- Проверить что триггеры создались
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public' AND trigger_name LIKE 'audit%';
```

### Шаг 3: Протестировать систему

```typescript
// В своём коде, например в API маршруте:
import { getTableAuditLog, describeChange } from '@/lib/services/audit'

// После какой-то операции в БД:
const { data: logs } = await getTableAuditLog('transactions', 10)

logs.forEach((log) => {
  console.log(describeChange(log))
})
```

Или через curl:
```bash
curl "http://localhost:3000/api/audit?type=table&table=transactions"
```

---

## ✨ Что теперь отслеживается?

### 🔴 Transactions (КРИТИЧНО)
```
❌ ДО: История платежей терялась, нельзя было отследить ошибки
✅ ПОСЛЕ: Каждый платёж логируется с временем, суммой, пользователем
```

**Примеры вопросов которые теперь можно ответить:**
- Когда был выполнен платёж № 123?
- Кто выполнил это пополнение баланса?
- Какой баланс был до платежа?
- Был ли платёж отменён или изменён?

### 📊 Ratings (Важно)
```
Кто кого оценил, когда, какова была оценка
Если оценка изменилась - видно старую и новую
```

### 📦 Tasks (Важно)
```
История изменения статуса заказа
От "опубликовано" к "принято" к "выполнено"
Кто и когда изменил статус
```

### 👤 Profiles (Важно)
```
Кто и когда изменил персональные данные
Была ли верификация добавлена/удалена
История изменения номера телефона/email
```

---

## 🔍 Примеры использования

### Пример 1: Проверить финансовую операцию

```typescript
const { data: history } = await getRecordAuditTrail('transactions', 'txn-123')

history.forEach((entry) => {
  console.log(`
    Операция: ${entry.operation}
    Когда: ${entry.created_at}
    Кто: ${entry.user_id}
    Сумма: ${entry.new_values?.amount} ₽
    Баланс после: ${entry.new_values?.balance_after} ₽
  `)
})
```

### Пример 2: Найти все удалённые платежи

```typescript
const { data: deletedPayments } = await getTableAuditLog('transactions', 1000)

const deletions = deletedPayments.filter((t) => t.operation === 'DELETE')

if (deletions.length > 0) {
  console.log(`⚠️ Найдено ${deletions.length} удалённых платежей!`)
  deletions.forEach((deletion) => {
    console.log(`
      ID: ${deletion.record_id}
      Сумма: ${deletion.old_values?.amount}
      Удалил: ${deletion.user_id}
      Когда: ${deletion.created_at}
    `)
  })
}
```

### Пример 3: Статистика изменений

```typescript
const stats = await getAuditStatistics('transactions', 
  new Date('2026-05-01'), 
  new Date('2026-05-05')
)

console.log(`
📊 За период 01-05 мая 2026:
  Всего операций: ${stats?.total}
  ✅ Создано платежей: ${stats?.inserts}
  ✏️ Изменено платежей: ${stats?.updates}
  🗑️ Удалено платежей: ${stats?.deletes}
`)
```

---

## ⚙️ Настройка

### Добавить новую таблицу на аудит

Если нужно добавить отслеживание ещё какой-то таблицы:

```sql
-- В конец файла 10_create_audit_log.sql добавь:
DROP TRIGGER IF EXISTS audit_your_table_trigger ON your_table;
CREATE TRIGGER audit_your_table_trigger
AFTER INSERT OR UPDATE OR DELETE ON your_table
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

### Изменить данные которые логируются

По умолчанию логируются ВСЕ поля. Чтобы исключить чувствительные:

```sql
-- Нужно модифицировать функцию audit_trigger_func()
-- Добавить проверку: IF col_name NOT IN ('sensitive_field') THEN ...
```

---

## 📊 Производительность

### Индексы
Автоматически созданы индексы на:
- `table_name` - быстрый поиск по таблице
- `record_id` - быстрый поиск по записи
- `user_id` - быстрый поиск по пользователю
- `operation` - фильтрация по типу
- `created_at DESC` - новые записи в начале
- Составной индекс на (table_name, record_id, created_at)

### Размер БД
- Один audit_log запись ≈ 500 байт - 1 KB
- Таблица на 1М записей = 500 MB - 1 GB

### Рекомендация
- Сохранять логи минимум 1 год для финансов
- Архивировать старые логи раз в год
- Периодически проверять размер таблицы

---

## ✅ Готово!

Система полностью готова к production использованию. 

**Дальше:**
1. ✅ Примени миграцию в Supabase
2. ✅ Протестируй через API
3. ✅ Читай AUDIT_LOG_GUIDE.md для подробных примеров
4. ✅ Используй в своём коде когда нужно отследить изменения

---

## 📞 Troubleshooting

### Проблема: Триггеры не срабатывают
**Решение:**
```sql
-- Проверить что триггеры создались
SELECT * FROM information_schema.triggers 
WHERE trigger_schema = 'public' AND trigger_name LIKE 'audit%';

-- Проверить что функция создана
SELECT * FROM pg_proc WHERE proname = 'audit_trigger_func';
```

### Проблема: RLS политики блокируют доступ
**Решение:**
```sql
-- Убедиться что политики созданы правильно
SELECT * FROM pg_policies WHERE tablename = 'audit_log';
```

### Проблема: audit_log таблица пуста после миграции
**Ожидается!** Логирование начинает работать ПОСЛЕ миграции. Сначала ничего там не будет.

Для тестирования сделай изменение в таблице:
```typescript
// Например, создай новую транзакцию
const { data } = await supabase
  .from('transactions')
  .insert([...])

// Потом проверь
const { data: logs } = await getTableAuditLog('transactions', 10)
console.log(logs)
```

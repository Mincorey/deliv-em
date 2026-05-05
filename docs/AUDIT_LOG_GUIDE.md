# Audit Log System Guide

Система аудит логирования отслеживает все изменения в критичных таблицах БД для обеспечения прозрачности, отладки и соответствия требованиям.

## 📋 Что отслеживается?

### Критичные таблицы (с автоматическим логированием)

1. **transactions** 🔴 CRITICAL
   - Все финансовые операции (пополнение, списание, возврат)
   - Кто выполнил платёж, сумма, дата
   - История баланса пользователя

2. **ratings** 📊
   - Все выставленные рейтинги
   - Изменения оценок и комментариев
   - Кто кого оценил и когда

3. **tasks** 📦
   - Создание новых заказов
   - Изменение статуса (опубликован → принят → выполнен)
   - Изменение стоимости и других параметров

4. **profiles** 👤
   - Обновление личных данных
   - Изменения в контактах и биографии
   - История верификации

## 🔍 Структура audit_log таблицы

```sql
audit_log {
  id uuid,                    -- Уникальный ID записи
  table_name text,            -- Название таблицы (transactions, ratings, etc)
  record_id uuid,             -- ID записи которая была изменена
  operation text,             -- INSERT, UPDATE или DELETE
  user_id uuid,               -- Кто сделал изменение
  old_values jsonb,           -- Старые значения (для UPDATE, DELETE)
  new_values jsonb,           -- Новые значения (для INSERT, UPDATE)
  changed_fields text[],      -- Список изменённых полей
  created_at timestamp,       -- Когда произошло изменение
}
```

## 💻 Использование в коде

### 1. Просмотр аудит логов через API

```bash
# Получить последние 50 записей
curl "http://localhost:3000/api/audit"

# История конкретной финансовой операции
curl "http://localhost:3000/api/audit?type=record&table=transactions&record_id=abc-123"

# Все действия пользователя
curl "http://localhost:3000/api/audit?type=user&user_id=user-123"

# История всех изменений в таблице transactions
curl "http://localhost:3000/api/audit?type=table&table=transactions&limit=100"

# Статистика изменений
curl "http://localhost:3000/api/audit?type=stats&table=transactions"
```

### 2. Использование сервиса в TypeScript коде

```typescript
import {
  getAuditLog,
  getRecordAuditTrail,
  getUserAuditActivity,
  getTableAuditLog,
  getChangeDetails,
  describeChange,
  getAuditStatistics,
} from '@/lib/services/audit'

// ────────────────────────────────────────────────────────────────

// Получить полный аудит трейл конкретной транзакции
const { data: transactionHistory } = await getRecordAuditTrail(
  'transactions',
  'transaction-id-123'
)

transactionHistory.forEach((entry) => {
  console.log(describeChange(entry))
  const changes = getChangeDetails(entry)
  changes.forEach((change) => {
    console.log(`${change.field}: ${change.oldValue} → ${change.newValue}`)
  })
})

// ────────────────────────────────────────────────────────────────

// Получить все действия пользователя за последний месяц
const { data: userActions } = await getUserAuditActivity('user-id-123', 100)

userActions.forEach((entry) => {
  if (entry.table_name === 'transactions') {
    console.log(`Финансовая операция: ${entry.operation}`)
    console.log(`Сумма: ${entry.new_values?.amount}`)
  }
})

// ────────────────────────────────────────────────────────────────

// Получить статистику транзакций за период
const stats = await getAuditStatistics(
  'transactions',
  new Date('2026-05-01'),
  new Date('2026-05-05')
)

console.log(`
  Всего изменений: ${stats?.total}
  Создано: ${stats?.inserts}
  Обновлено: ${stats?.updates}
  Удалено: ${stats?.deletes}
`)
```

## 🔐 Безопасность

### Row Level Security (RLS)

Аудит логи защищены RLS политиками:

- ✅ Аутентифицированные пользователи могут **читать** аудит логи
- ✅ Система может **писать** в аудит логи
- ❌ Нельзя вручную обновлять или удалять логи

## 📊 Примеры использования

### 1. Проверка финансовых операций

```typescript
// Получить все транзакции с проверкой целостности
const { data: transactions } = await getTableAuditLog('transactions', 1000)

// Найти удалённые или изменённые платежи
const suspiciousTransactions = transactions.filter(
  (t) => t.operation === 'UPDATE' || t.operation === 'DELETE'
)

suspiciousTransactions.forEach((audit) => {
  console.log(`⚠️ Транзакция ${audit.record_id}`)
  console.log(`Операция: ${audit.operation}`)
  console.log(`Исполнитель: ${audit.user_id}`)
  console.log(`Когда: ${audit.created_at}`)
  
  const changes = getChangeDetails(audit)
  changes.forEach((change) => {
    console.log(`  ${change.field}: ${change.oldValue} → ${change.newValue}`)
  })
})
```

### 2. Отследить изменения рейтинга

```typescript
// Получить историю оценки пользователя
const { data: ratingHistory } = await getRecordAuditTrail(
  'ratings',
  'rating-id-456'
)

if (ratingHistory.length > 1) {
  console.log('⚠️ Рейтинг был изменён!')
  
  ratingHistory.forEach((entry, i) => {
    if (entry.operation === 'UPDATE') {
      const changes = getChangeDetails(entry)
      console.log(`Изменение ${i}:`)
      console.log(describeChange(entry))
      
      changes.forEach((change) => {
        console.log(`  ${change.field}: ${change.oldValue} → ${change.newValue}`)
      })
    }
  })
}
```

### 3. Аудит профилей пользователей

```typescript
// Отследить изменения в профиле
const { data: profileChanges } = await getRecordAuditTrail(
  'profiles',
  'profile-id-789'
)

profileChanges.forEach((entry) => {
  console.log(describeChange(entry))
  
  if (entry.operation === 'UPDATE') {
    const changes = getChangeDetails(entry)
    
    // Показать только важные изменения
    const importantChanges = changes.filter((c) =>
      ['phone', 'email', 'avatar_url', 'is_verified'].includes(c.field)
    )
    
    importantChanges.forEach((change) => {
      console.log(`Изменено ${change.field}:`)
      console.log(`  От: ${change.oldValue}`)
      console.log(`  К: ${change.newValue}`)
    })
  }
})
```

## 🧹 Maintenance

### Очистка старых логов (если нужно)

```sql
-- Удалить логи старше 1 года
DELETE FROM audit_log
WHERE created_at < NOW() - INTERVAL '1 year';

-- Очистить логи по таблице
DELETE FROM audit_log
WHERE table_name = 'some_table'
  AND created_at < NOW() - INTERVAL '6 months';
```

### Оптимизация производительности

Индексы уже созданы для быстрого поиска по:
- `table_name` - быстрый поиск по таблице
- `record_id` - быстрый поиск по записи
- `user_id` - быстрый поиск по пользователю
- `operation` - фильтрация по типу операции
- `created_at DESC` - для новых записей в начале

## ⚠️ Важные замечания

1. **Нельзя удалять аудит логи вручную** - это нарушит целостность данных
2. **Нельзя обновлять аудит логи** - они должны быть неизменяемы
3. **user_id может быть NULL** - если система не смогла определить пользователя
4. **Все логи хранятся в UTC** - обращайте внимание на временные зоны

## 📈 Best Practices

- ✅ Регулярно проверяй критичные операции (transactions, ratings)
- ✅ Создавай отчёты о подозрительных изменениях
- ✅ Исправляй проблемы на основе аудита
- ✅ Сохраняй долгую историю (минимум 1 год для финансов)
- ❌ Не показывай полные аудит логи обычным пользователям
- ❌ Не удаляй старые логи автоматически

'use client'

import Link from 'next/link'
import { AnimatedPage, AnimatedItem } from '@/components/ui/Animated'

export default function PrivacyPage() {
  return (
    <AnimatedPage className="p-4 sm:p-6 max-w-2xl mx-auto">

      {/* Back */}
      <AnimatedItem className="mb-4">
        <Link href="/about" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'var(--text-3)', fontSize: '0.85rem', fontWeight: 600,
          textDecoration: 'none', transition: 'color 0.18s',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Назад
        </Link>
      </AnimatedItem>

      {/* Header */}
      <AnimatedItem className="rounded-2xl p-8 mb-6 text-center" style={{ background: 'linear-gradient(135deg,#00236f,#006c49)' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
        }}>
          <span className="material-symbols-outlined text-white" style={{ fontSize: '1.75rem' }}>shield</span>
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          Политика конфиденциальности
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', marginTop: 6 }}>
          Deliv&apos;em · Дата вступления в силу: 20 апреля 2026 г.
        </p>
      </AnimatedItem>

      {/* Sections */}
      <DocSection icon="info" title="1. Введение">
        <p>
          Эта Политика конфиденциальности описывает, как платформа Deliv&apos;em («Сервис») собирает, использует, хранит и защищает вашу личную информацию.
          Сервис разработан Mincorey и действует в соответствии с законодательством Республики Абхазия.
        </p>
      </DocSection>

      <DocSection icon="database" title="2. Информация, которую мы собираем">
        <BulletList items={[
          { icon: 'person', text: 'Информация учётной записи: электронная почта, пароль (хэш), имя, фамилия' },
          { icon: 'phone', text: 'Контактная информация: номер телефона, город проживания' },
          { icon: 'badge', text: 'Персональные данные: дата рождения, биография, фотография профиля' },
          { icon: 'location_on', text: 'Геолокационные данные: город, текущие координаты (для курьеров при выполнении задач)' },
          { icon: 'task', text: 'Информация о задачах: описание, адреса отправления и доставки, координаты, тип задачи, сроки выполнения' },
          { icon: 'forum', text: 'Коммуникации: сообщения в чате между пользователями в контексте задач' },
          { icon: 'account_balance_wallet', text: 'Финансовые данные: история платежей, баланс электронного кошелька, операции пополнения' },
          { icon: 'star', text: 'Рейтинги и отзывы: оценки пользователей, комментарии о качестве выполнения' },
        ]} />
      </DocSection>

      <DocSection icon="manage_accounts" title="3. Как мы используем вашу информацию">
        <BulletList items={[
          { icon: 'build', text: 'Предоставление услуг: создание учётной записи, размещение и выполнение задач, система чатов и рейтинга' },
          { icon: 'payments', text: 'Обработка платежей: пополнение кошелька через платёжный сервис AnyPay' },
          { icon: 'trending_up', text: 'Улучшение сервиса: аналитика, отладка ошибок, оптимизация функциональности' },
          { icon: 'security', text: 'Безопасность: предотвращение мошенничества, защита от злоупотреблений' },
          { icon: 'notifications', text: 'Связь: отправка уведомлений, обновлений о статусе задач, важной информации о сервисе' },
          { icon: 'gavel', text: 'Соответствие закону: выполнение юридических обязательств' },
        ]} />
      </DocSection>

      <DocSection icon="lock" title="4. Хранение и защита данных">
        <p className="mb-4">
          Все данные хранятся в защищённой базе данных Supabase с использованием шифрования TLS/SSL.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Активные учётные записи', value: 'хранятся, пока вы пользуетесь сервисом' },
            { label: 'История задач и платежей', value: 'хранится 3 года в целях аудита' },
            { label: 'Удалённые аккаунты', value: 'архивируются 30 дней, затем удаляются' },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4,
              padding: '10px 0', borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ color: 'var(--text-3)', fontSize: '0.88rem' }}>{row.label}</span>
              <span style={{ color: 'var(--text-1)', fontSize: '0.88rem', fontWeight: 600 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection icon="visibility_off" title="5. Управление приватностью вашего профиля">
        <p className="mb-4">Вы можете контролировать видимость следующих данных:</p>
        <BulletList items={[
          { icon: 'phone_locked', text: 'Номер телефона — скрыт по умолчанию' },
          { icon: 'edit_note', text: 'Биография — видна по умолчанию' },
          { icon: 'cake', text: 'Дата рождения — скрыта по умолчанию' },
        ]} />
        <InfoBox icon="info">
          Email и баланс кошелька никогда не показываются другим пользователям.
        </InfoBox>
      </DocSection>

      <DocSection icon="payments" title="6. Платежи и финансовая информация">
        <p>
          Пополнение кошелька осуществляется через платёжный сервис AnyPay. Мы не храним полные номера карт или данные платёжных средств — эта информация обрабатывается напрямую AnyPay.
          Мы сохраняем только ID транзакции и сумму операции.
        </p>
      </DocSection>

      <DocSection icon="child_care" title="7. Возрастные ограничения">
        <BulletList items={[
          { icon: 'person', text: 'Заказчики (customers): без ограничений' },
          { icon: 'delivery_dining', text: 'Курьеры (couriers): от 14 лет включительно' },
        ]} />
        <p className="mt-3">
          Регистрируясь как курьер, вы подтверждаете, что вам исполнилось 14 лет или больше.
        </p>
      </DocSection>

      <DocSection icon="share" title="8. Передача данных третьим лицам">
        <p className="mb-4">Мы не продаём и не передаём ваши личные данные третьим лицам, за исключением:</p>
        <BulletList items={[
          { icon: 'payments', text: 'Платёжный сервис AnyPay — только для обработки платежей' },
          { icon: 'code', text: 'Разработчик сервиса — для улучшения функциональности' },
          { icon: 'gavel', text: 'Компетентные органы — если требуется по закону' },
        ]} />
      </DocSection>

      <DocSection icon="verified_user" title="9. Ваши права">
        <p className="mb-4">Вы имеете право:</p>
        <BulletList items={[
          { icon: 'manage_search', text: 'Доступ к своим данным и их исправление' },
          { icon: 'delete', text: 'Запрос удаления аккаунта и связанных данных' },
          { icon: 'unsubscribe', text: 'Отказ от маркетинговых коммуникаций' },
          { icon: 'download', text: 'Получение копии своих данных в структурированном формате' },
        ]} />
        <InfoBox icon="mail">
          Для реализации этих прав свяжитесь с разработчиком: <strong>mincorey@internet.ru</strong>
        </InfoBox>
      </DocSection>

      <DocSection icon="update" title="10. Изменения в политике">
        <p>
          Мы можем обновлять эту политику в любое время. Значительные изменения будут доведены до вас по электронной почте или через уведомление в приложении.
        </p>
      </DocSection>

      <DocSection icon="contacts" title="11. Контакты" last>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <ContactRow icon="mail" label="Email" value="mincorey@internet.ru" />
          <ContactRow icon="send" label="Telegram" value="@Mincorey" />
        </div>
      </DocSection>

    </AnimatedPage>
  )
}

/* ── Shared sub-components ── */

function DocSection({ icon, title, children, last = false }: {
  icon: string; title: string; children: React.ReactNode; last?: boolean
}) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1.5px solid var(--border)',
      boxShadow: 'var(--shadow-sm)', borderRadius: '1rem',
      padding: '1.5rem', marginBottom: last ? 0 : '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'var(--brand-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="material-symbols-outlined fill-icon" style={{ fontSize: 18, color: 'var(--brand-text)' }}>{icon}</span>
        </div>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-1)' }}>{title}</h2>
      </div>
      <div style={{ fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  )
}

function BulletList({ items }: { items: { icon: string; text: string }[] }) {
  return (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span className="material-symbols-outlined fill-icon" style={{ fontSize: 16, color: 'var(--brand-text)', marginTop: 2, flexShrink: 0 }}>{item.icon}</span>
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  )
}

function InfoBox({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 14,
      background: 'var(--brand-soft)', border: '1.5px solid var(--border-soft)',
      borderRadius: '0.75rem', padding: '10px 14px',
      fontSize: '0.85rem', color: 'var(--brand-text)',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span>{children}</span>
    </div>
  )
}

function ContactRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span className="material-symbols-outlined fill-icon" style={{ fontSize: 18, color: 'var(--brand-text)', flexShrink: 0 }}>{icon}</span>
      <span style={{ color: 'var(--text-3)', fontSize: '0.85rem', minWidth: 70 }}>{label}</span>
      <span style={{ color: 'var(--text-1)', fontWeight: 700, fontSize: '0.88rem' }}>{value}</span>
    </div>
  )
}

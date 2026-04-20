'use client'

import Link from 'next/link'
import { AnimatedPage, AnimatedItem } from '@/components/ui/Animated'

export default function TermsPage() {
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
          <span className="material-symbols-outlined text-white" style={{ fontSize: '1.75rem' }}>gavel</span>
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          Условия использования
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', marginTop: 6 }}>
          Deliv&apos;em · Дата вступления в силу: 20 апреля 2026 г.
        </p>
      </AnimatedItem>

      {/* Sections */}
      <DocSection icon="menu_book" title="1. Определения и основные понятия">
        <DefinitionList items={[
          { term: '«Сервис»', def: 'платформа Deliv\'em для размещения, поиска и выполнения задач доставки' },
          { term: '«Пользователь»', def: 'физическое лицо, зарегистрированное на Сервисе' },
          { term: '«Заказчик»', def: 'пользователь, который размещает задачи' },
          { term: '«Курьер»', def: 'пользователь, который принимает и выполняет задачи' },
          { term: '«Задача»', def: 'поручение по доставке или выполнению определённого действия' },
          { term: '«Разработчик»', def: 'разработчик Сервиса, Mincorey' },
        ]} />
      </DocSection>

      <DocSection icon="handshake" title="2. Признание и согласие">
        <p className="mb-4">Регистрируясь на Сервисе, вы подтверждаете, что:</p>
        <BulletList items={[
          { icon: 'check_circle', text: 'Вы прочитали и согласны со всеми условиями этого соглашения' },
          { icon: 'check_circle', text: 'Вы имеете право заключать договоры' },
          { icon: 'check_circle', text: 'Если вы курьер — вам исполнилось не менее 14 лет' },
          { icon: 'check_circle', text: 'Вся предоставленная вами информация является правдивой и полной' },
        ]} />
      </DocSection>

      <DocSection icon="person" title="3. Правила для заказчиков">
        <SubTitle>Размещение задач</SubTitle>
        <BulletList items={[
          { icon: 'edit', text: 'Задача должна содержать чёткое описание того, что нужно доставить или сделать' },
          { icon: 'location_on', text: 'Адреса отправления и доставки должны быть в Республике Абхазия' },
          { icon: 'payments', text: 'Вознаграждение курьера устанавливает заказчик и должно быть справедливым' },
          { icon: 'block', text: 'Запрещено указывать запрещённые, опасные или незаконные предметы' },
        ]} />

        <SubTitle className="mt-4">Платежи</SubTitle>
        <BulletList items={[
          { icon: 'account_balance_wallet', text: 'При размещении задачи с вашего кошелька взимается комиссия (100 руб.)' },
          { icon: 'check_circle', text: 'После выполнения задачи вознаграждение курьера переводится из вашего кошелька' },
          { icon: 'undo', text: 'Возврат средств возможен только при отмене не принятой задачи' },
        ]} />

        <SubTitle className="mt-4">Ответственность заказчика</SubTitle>
        <BulletList items={[
          { icon: 'warning', text: 'Вы несёте полную ответственность за содержимое задачи' },
          { icon: 'warning', text: 'Вы несёте ответственность за правильность указанных адресов' },
          { icon: 'warning', text: 'Вы должны предоставить точные контакты получателя' },
        ]} />
      </DocSection>

      <DocSection icon="delivery_dining" title="4. Правила для курьеров">
        <SubTitle>Требования к курьерам</SubTitle>
        <BulletList items={[
          { icon: 'child_care', text: 'Вам должно быть не менее 14 лет' },
          { icon: 'directions_bike', text: 'Вы должны иметь надёжный способ передвижения' },
          { icon: 'verified', text: 'Вы должны быть в состоянии безопасно выполнять задачи' },
        ]} />

        <SubTitle className="mt-4">Процесс выполнения задачи</SubTitle>
        <StepList steps={[
          'Вы просматриваете доступные задачи в ленте',
          'Вы принимаете задачу, если готовы её выполнить',
          'Вы выполняете задачу в соответствии с описанием',
          'Заказчик подтверждает выполнение, и вы получаете вознаграждение',
        ]} />

        <SubTitle className="mt-4">Отмена задачи курьером</SubTitle>
        <BulletList items={[
          { icon: 'warning', text: 'Если вы отменяете задачу после принятия без уважительной причины, это может повлиять на ваш рейтинг' },
          { icon: 'block', text: 'При систематических отменах может быть ограничен доступ к новым задачам' },
        ]} />
      </DocSection>

      <DocSection icon="star" title="5. Система рейтинга и отзывов">
        <BulletList items={[
          { icon: 'star', text: 'После выполнения задачи обе стороны могут оценить друг друга (1–5 звёзд)' },
          { icon: 'trending_up', text: 'Средний рейтинг курьера влияет на его видимость в системе' },
          { icon: 'check_circle', text: 'Отзывы должны быть честными и отражать реальный опыт' },
          { icon: 'block', text: 'Запрещены ложные отзывы, угрозы, оскорбления и спам' },
        ]} />
      </DocSection>

      <DocSection icon="block" title="6. Запрещённое поведение">
        <BulletList items={[
          { icon: 'dangerous', text: 'Размещать задачи с запрещённым, опасным или незаконным содержимым' },
          { icon: 'money_off', text: 'Производить платежи за пределами системы' },
          { icon: 'fraud', text: 'Мошенничество, обман или манипуляция другими пользователями' },
          { icon: 'sentiment_very_dissatisfied', text: 'Угрозы, оскорбления, травля, дискриминация' },
          { icon: 'security', text: 'Хакинг, взлом аккаунтов, попытки обойти систему безопасности' },
          { icon: 'privacy_tip', text: 'Неправомерное использование персональных данных других пользователей' },
          { icon: 'report', text: 'Распространение спама, вредоносного ПО или других вредоносных материалов' },
        ]} />
      </DocSection>

      <DocSection icon="shield" title="7. Ограничение ответственности">
        <p className="mb-4">Сервис предоставляется «как есть» без гарантий. Разработчик не несёт ответственности за:</p>
        <BulletList items={[
          { icon: 'warning', text: 'Потерю, повреждение, кражу или задержку доставки' },
          { icon: 'warning', text: 'Качество выполнения задачи курьером' },
          { icon: 'warning', text: 'Поведение, действия или бездействие пользователей' },
          { icon: 'warning', text: 'Технические сбои, неполадки, перебои в работе' },
          { icon: 'warning', text: 'Косвенный, случайный или устарелой ущерб' },
          { icon: 'warning', text: 'Проблемы, связанные с платёжной системой AnyPay' },
        ]} />
      </DocSection>

      <DocSection icon="balance" title="8. Возмещение убытков">
        <p>
          Если ваша задача выполнена неправильно или не выполнена, вы можете обратиться в поддержку для рассмотрения спора.
          Разработчик рассмотрит ситуацию и вынесет решение на основе имеющихся доказательств.
        </p>
      </DocSection>

      <DocSection icon="block" title="9. Прекращение доступа">
        <p className="mb-4">Разработчик имеет право заблокировать вашу учётную запись или ограничить доступ без предварительного уведомления, если вы:</p>
        <BulletList items={[
          { icon: 'rule', text: 'Нарушили условия этого соглашения' },
          { icon: 'fraud', text: 'Участвовали в мошенничестве или незаконной деятельности' },
          { icon: 'dangerous', text: 'Размещали запрещённое содержимое' },
          { icon: 'thumb_down', text: 'Получили низкий рейтинг из-за неправомерных действий' },
        ]} />
      </DocSection>

      <DocSection icon="support_agent" title="10. Контакты и служба поддержки">
        <p className="mb-4">Если у вас есть вопросы, жалобы или вам нужна помощь:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ContactRow icon="mail" label="Email" value="mincorey@internet.ru" />
          <ContactRow icon="send" label="Telegram" value="@Mincorey" />
        </div>
      </DocSection>

      <DocSection icon="article" title="11. Заключительные положения" last>
        <BulletList items={[
          { icon: 'gavel', text: 'Эти условия управляются законодательством Республики Абхазия' },
          { icon: 'update', text: 'Разработчик может изменять условия в любое время' },
          { icon: 'notifications', text: 'Значительные изменения будут доведены до пользователей' },
          { icon: 'verified', text: 'Если какое-либо положение признано недействительным, остальные остаются в силе' },
          { icon: 'check_circle', text: 'Продолжая использовать Сервис, вы автоматически принимаете все изменения' },
        ]} />
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
          background: 'var(--green-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="material-symbols-outlined fill-icon" style={{ fontSize: 18, color: 'var(--green)' }}>{icon}</span>
        </div>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-1)' }}>{title}</h2>
      </div>
      <div style={{ fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  )
}

function SubTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={className} style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: 8, fontSize: '0.88rem' }}>
      {children}
    </p>
  )
}

function BulletList({ items }: { items: { icon: string; text: string }[] }) {
  return (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span className="material-symbols-outlined fill-icon" style={{ fontSize: 16, color: 'var(--green)', marginTop: 2, flexShrink: 0 }}>{item.icon}</span>
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  )
}

function DefinitionList({ items }: { items: { term: string; def: string }[] }) {
  return (
    <dl style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
          <dt style={{ fontWeight: 700, color: 'var(--text-1)', minWidth: 110 }}>{item.term}</dt>
          <dd style={{ color: 'var(--text-2)', margin: 0, flex: 1, minWidth: 160 }}>— {item.def}</dd>
        </div>
      ))}
    </dl>
  )
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 0, margin: 0, listStyle: 'none' }}>
      {steps.map((step, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{
            width: 22, height: 22, borderRadius: 9999, flexShrink: 0,
            background: 'var(--green-soft)', color: 'var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.72rem', fontWeight: 800, marginTop: 1,
          }}>{i + 1}</span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  )
}

function ContactRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span className="material-symbols-outlined fill-icon" style={{ fontSize: 18, color: 'var(--green)', flexShrink: 0 }}>{icon}</span>
      <span style={{ color: 'var(--text-3)', fontSize: '0.85rem', minWidth: 70 }}>{label}</span>
      <span style={{ color: 'var(--text-1)', fontWeight: 700, fontSize: '0.88rem' }}>{value}</span>
    </div>
  )
}

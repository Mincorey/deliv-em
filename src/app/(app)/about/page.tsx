export default function AboutPage() {
  const steps = [
    {
      n: 1,
      color: '#dce1ff',
      textColor: '#00236f',
      title: 'Заказчик создаёт поручение',
      desc: 'Описывает задачу, маршрут, срок и вознаграждение курьеру',
    },
    {
      n: 2,
      color: '#6cf8bb33',
      textColor: '#006c49',
      title: 'Курьер принимает задание',
      desc: 'Видит задания в ленте и выбирает подходящее',
    },
    {
      n: 3,
      color: '#eceef0',
      textColor: '#191c1e',
      title: 'Выполнение и оценка',
      desc: 'Задание выполнено — оба участника оставляют оценки',
    },
  ]

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div
        className="rounded-2xl p-8 mb-6 text-center"
        style={{ background: 'linear-gradient(135deg,#00236f,#006c49)' }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'rgba(255,255,255,.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <span className="material-symbols-outlined text-white" style={{ fontSize: '2rem' }}>
            local_shipping
          </span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          Deliv&apos;em
        </h1>
        <p className="text-white text-sm mt-1" style={{ opacity: 0.7 }}>
          Сервис микропоручений · Абхазия
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 mb-4">
        <h3 className="font-bold text-lg mb-3">О сервисе</h3>
        <p className="text-sm leading-relaxed mb-3" style={{ color: '#757682' }}>
          Deliv&apos;em — первая P2P-платформа микропоручений в Республике Абхазия. Мы соединяем
          заказчиков и исполнителей, чтобы любая задача была выполнена быстро и надёжно.
        </p>
        <p className="text-sm leading-relaxed mb-3" style={{ color: '#757682' }}>
          Доставка документов, покупка продуктов, транспортировка материалов, передача
          подарков — всё это можно делегировать проверенным местным курьерам.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: '#757682' }}>
          Сервис работает во всех городах Абхазии: Сухум, Гагра, Гудаута, Новый Афон,
          Очамчыра и других.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 mb-4">
        <h3 className="font-bold text-lg mb-4">Как это работает</h3>
        <div className="flex flex-col gap-4">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-4">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9999,
                  background: s.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontWeight: 800,
                  color: s.textColor,
                  fontSize: '0.9rem',
                }}
              >
                {s.n}
              </div>
              <div>
                <p className="font-bold text-sm">{s.title}</p>
                <p className="text-xs mt-0.5" style={{ color: '#757682' }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-3">Информация</h3>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between text-sm">
            <span style={{ color: '#757682' }}>Версия</span>
            <span className="font-bold">1.0.0 Beta</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#757682' }}>Год запуска</span>
            <span className="font-bold">2025</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#757682' }}>Регион</span>
            <span className="font-bold">Республика Абхазия</span>
          </div>
          <p className="text-xs mt-2" style={{ color: '#c5c5d3' }}>
            Полная политика конфиденциальности и условия использования находятся в разработке.
          </p>
        </div>
      </div>
    </div>
  )
}

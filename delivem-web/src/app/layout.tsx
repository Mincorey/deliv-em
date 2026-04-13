import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: "Deliv'em — Сервис поручений в Абхазии",
  description:
    'Первая P2P-платформа микропоручений в Республике Абхазия. Доставка документов, продуктов, материалов и многое другое.',
  openGraph: {
    title: "Deliv'em",
    description: 'Сервис микропоручений в Абхазии',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body style={{ background: '#f7f9fb', color: '#191c1e' }}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}

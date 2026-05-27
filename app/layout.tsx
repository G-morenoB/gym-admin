import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'App Gym',
  description: 'Sistema de gestión de gimnasio',
  manifest: '/manifest.json',
  themeColor: '#111827',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'App Gym',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#111827" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="App Gym" />
      </head>
      <body>{children}</body>
    </html>
  )
}
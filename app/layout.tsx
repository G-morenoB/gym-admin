import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Aquiles Gym',
  description: 'Sistema de gestión de gimnasio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
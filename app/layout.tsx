import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Calculadora Marketplace',
  description: 'Precificação Shopee e Mercado Livre com PWA.',
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">{children}</body>
    </html>
  )
}
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { ToastProvider } from '@/components/Toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Manpower Analytics Dashboard',
  description: 'HR Analytics and Retention Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <ToastProvider>
          <div className="flex">
            <Sidebar />
            <main className="flex-1 min-h-screen p-8 bg-gray-50 overflow-auto">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  )
}

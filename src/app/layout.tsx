'use client'

import { Inter } from 'next/font/google'
import { Analytics } from "@vercel/analytics/react"
import './globals.css'
import { useEffect } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'FrostScript',
  description: 'AI that freezes time',
}

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.hash.includes('debug')
    ) {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/eruda'
      script.onload = () => (window as any).eruda.init()
      document.body.appendChild(script)
    }
  }, [])

  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
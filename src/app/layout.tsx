import { Inter } from 'next/font/google'
import { Analytics } from "@vercel/analytics/react"
import './globals.css'

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
  return (
    <html lang="en">
      {/* You can apply the Inter font class to the <body> to style all text */}
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

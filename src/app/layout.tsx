import { Inter } from 'next/font/google'
import { Analytics } from "@vercel/analytics/react"
import './globals.css'
import ErudaDebug from '../components/ErudaDebug' // <-- Add this line

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Hello Friend',
  description: 'AI as a friend, not a service',
}

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErudaDebug /> {/* <-- Inject here */}
        {children}
        <Analytics />
      </body>
    </html>
  )
}
import { Inter } from 'next/font/google'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css'
import ErudaDebug from '../components/ErudaDebug'
import Providers from './Providers' // <-- Added Providers import

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Hello Friend',
  description: 'AI as a friend, not a service',
}
console.log('Root layout rendered on the server');

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ErudaDebug />
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

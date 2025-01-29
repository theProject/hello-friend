import FrostScript from '@/components/FrostScript'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FrostScript',
  description: 'AI that freezes time.',
}

export default function Home() {
  return (
    <main className="min-h-screen w-full">
      <FrostScript />
    </main>
  )
}
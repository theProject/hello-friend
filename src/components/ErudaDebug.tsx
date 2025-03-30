'use client'

import { useEffect } from 'react'

export default function ErudaDebug() {
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

  return null
}
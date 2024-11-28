import type { AppProps } from 'next/app'
import { SessionProvider } from '@/context/SessionContext'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider>
      <Component {...pageProps} />
    </SessionProvider>
  )
} 
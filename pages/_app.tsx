import React from 'react'
import type { AppProps } from 'next/app'
import 'intl-relative-time-format'
import '../styles/globals.css'
import { Provider as ChakraUIProvider } from '@/components/ui/provider'

import '@fontsource/roboto'
export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraUIProvider forcedTheme={'light'}>
      <Component {...pageProps} />
    </ChakraUIProvider>
  )
}

import React, { useState } from 'react'
import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import 'intl-relative-time-format'
import '../styles/globals.css'
import { Provider as ChakraUIProvider } from '@/components/ui/provider'

import '@fontsource/roboto'
export default function MyApp({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraUIProvider forcedTheme={'light'}>
        <Component {...pageProps} />
      </ChakraUIProvider>
    </QueryClientProvider>
  )
}

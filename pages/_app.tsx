import React, { useState } from 'react'
import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import 'antd/dist/reset.css'
import '../styles/globals.css'

import '@fontsource/roboto'
export default function MyApp({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient())
  return (
      <QueryClientProvider client={queryClient}>
          <ConfigProvider
              theme={{
                  token: {
                      colorPrimary: '#00ad86',
                      fontFamily:
                          "Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,\n" +
                          "  'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',\n" +
                          "  'Noto Color Emoji'",
                  },
              }}
          >
            <Component {...pageProps} />
          </ConfigProvider>
      </QueryClientProvider>
  )
}

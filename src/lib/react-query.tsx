'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import React from 'react'

const ReactQueryDevtools =
  process.env.NODE_ENV === 'development'
    ? dynamic(
        () =>
          import('@tanstack/react-query-devtools').then(
            (mod) => mod.ReactQueryDevtools,
          ),
        { ssr: false },
      )
    : () => null

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = React.useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

import { useEffect } from 'react'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'

import { queryClient } from '@/core/api'
import { router } from '@/core/app/routers'
import '@/core/app/toast.scss'

function BrowserTelemetry(): null {
  useEffect(() => {
    let lastUrl = window.location.href

    const sendTelemetry = (): void => {
      const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
      const baseUrl = apiUrl.replace(/\/$/, '')
      const path = window.location.pathname

      const telemetryUrl =
        `${baseUrl}/ingest/telemetry?path=${encodeURIComponent(path)}`

      void fetch(telemetryUrl, {
        method: 'GET',
        credentials: 'omit',
        keepalive: true,
      }).catch(() => {
        // Telemetry must never interfere with the application.
      })
    }

    const handleNavigation = (): void => {
      const currentUrl = window.location.href

      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl
        sendTelemetry()
      }
    }

    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function (...args): void {
      originalPushState.apply(this, args)
      window.dispatchEvent(new Event('vigilo:navigation'))
    }

    history.replaceState = function (...args): void {
      originalReplaceState.apply(this, args)
      window.dispatchEvent(new Event('vigilo:navigation'))
    }

    window.addEventListener('popstate', handleNavigation)
    window.addEventListener('hashchange', handleNavigation)
    window.addEventListener('vigilo:navigation', handleNavigation)

    sendTelemetry()

    return () => {
      history.pushState = originalPushState
      history.replaceState = originalReplaceState

      window.removeEventListener('popstate', handleNavigation)
      window.removeEventListener('hashchange', handleNavigation)
      window.removeEventListener(
        'vigilo:navigation',
        handleNavigation,
      )
    }
  }, [])

  return null
}

export default function App(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserTelemetry />

      <div className="app">
        <RouterProvider router={router} />

        <Toaster
          position="top-right"
          duration={2000}
          theme="dark"
        />
      </div>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

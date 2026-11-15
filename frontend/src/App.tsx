import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { OverviewPage } from '@/pages/OverviewPage'
import { DetectionsPage } from '@/pages/DetectionsPage'
import { DetectionDetailPage } from '@/pages/DetectionDetailPage'
import { FlowsPage } from '@/pages/FlowsPage'
import { FlowDetailPage } from '@/pages/FlowDetailPage'
import { WindowsPage } from '@/pages/WindowsPage'
import { WindowDetailPage } from '@/pages/WindowDetailPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Central QueryClient with production defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="detections" element={<DetectionsPage />} />
            <Route path="detections/:id" element={<DetectionDetailPage />} />
            <Route path="flows" element={<FlowsPage />} />
            <Route path="flows/:id" element={<FlowDetailPage />} />
            <Route path="windows" element={<WindowsPage />} />
            <Route path="windows/:id" element={<WindowDetailPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

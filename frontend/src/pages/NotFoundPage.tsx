import React from 'react'
import { NotFoundState } from '@/components/common/NotFoundState'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-12">
      <NotFoundState
        title="Page Not Found"
        message="The page you are looking for does not exist in the NetGuard application."
        backTo="/"
        backLabel="Return to Dashboard"
      />
    </div>
  )
}

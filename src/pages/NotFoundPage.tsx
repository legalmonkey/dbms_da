import { FileQuestion } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/data/EmptyState'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <>
      {/* See ForbiddenPage: this page is the whole view and needs its own h1. */}
      <h1 className="sr-only">Page not found</h1>
      <EmptyState
        icon={FileQuestion}
        title="Page not found"
        description="That address does not match any screen in this system."
        action={
          <Button variant="primary" asChild>
            <Link to="/">Go to the dashboard</Link>
          </Button>
        }
      />
    </>
  )
}

import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/data/EmptyState'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS } from '@/types'
import { ROLE_HOME } from '@/app/navigation'

export function ForbiddenPage() {
  const { session } = useAuth()
  const role = session?.user.role
  const home = role ? (ROLE_HOME[role] ?? '/dashboard') : '/login'

  return (
    <>
      {/* This page is the entire view, so the document needs a heading. The
          EmptyState title is a paragraph by design: everywhere else it sits
          inside a page that already has its own h1. */}
      <h1 className="sr-only">Access denied</h1>
      <EmptyState
        icon={ShieldAlert}
        title="You do not have access to this screen"
        description={
          role
            ? `The ${ROLE_LABELS[role]} workspace does not include this screen. Open the workspace that manages it from the switcher in the top bar.`
            : 'Sign in to continue.'
        }
        action={
          <Button variant="primary" asChild>
            <Link to={home}>Back to your dashboard</Link>
          </Button>
        }
      />
    </>
  )
}

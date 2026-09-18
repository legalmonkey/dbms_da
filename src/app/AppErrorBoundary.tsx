import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from '@/components/data/ErrorState'

interface State {
  error: Error | null
}

/**
 * Last line of defence. A render crash shows a recoverable message instead of a
 * blank white page.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-canvas p-6">
          <ErrorState
            error={this.state.error}
            onRetry={() => {
              this.setState({ error: null })
              window.location.reload()
            }}
          />
        </div>
      )
    }
    return this.props.children
  }
}

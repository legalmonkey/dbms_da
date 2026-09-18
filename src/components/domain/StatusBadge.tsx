import { Ban, CheckCircle2, CircleDashed, Clock, FlaskConical, Truck, XCircle } from 'lucide-react'
import type { ComponentType } from 'react'
import { Badge } from '@/components/ui/Badge'
import { PulseDot } from '@/components/domain/PulseDot'
import { ORDER_STATUS_DESCRIPTIONS, type OrderStatus, type SampleStatus } from '@/types'

/**
 * Status badges for TestOrder.Status and Sample.Status.
 *
 * Each badge pairs a distinct icon with the status word, so the state survives
 * a greyscale print of the report and does not rely on colour vision. States
 * that are actively in motion also carry a pulsing dot.
 */

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'teal'

interface StatusVisual {
  icon: ComponentType<{ className?: string }>
  tone: Tone
  /** Shows a dot alongside the icon; `live` makes it pulse. */
  dot?: boolean
  live?: boolean
}

const ORDER_VISUALS: Record<OrderStatus, StatusVisual> = {
  Pending: { icon: CircleDashed, tone: 'neutral' },
  Processing: { icon: Clock, tone: 'warning', dot: true, live: true },
  Completed: { icon: CheckCircle2, tone: 'success', dot: true },
  Cancelled: { icon: Ban, tone: 'danger' },
}

const SAMPLE_VISUALS: Record<SampleStatus, StatusVisual> = {
  Collected: { icon: FlaskConical, tone: 'info' },
  'In Transit': { icon: Truck, tone: 'teal', dot: true, live: true },
  Received: { icon: CheckCircle2, tone: 'success', dot: true },
  Rejected: { icon: XCircle, tone: 'danger' },
}

function StatusContent({ visual, label }: { visual: StatusVisual; label: string }) {
  const Icon = visual.icon
  return (
    <>
      {visual.dot ? <PulseDot live={visual.live} /> : <Icon aria-hidden="true" />}
      {label}
    </>
  )
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const visual = ORDER_VISUALS[status]
  return (
    <Badge tone={visual.tone} title={ORDER_STATUS_DESCRIPTIONS[status]}>
      <StatusContent visual={visual} label={status} />
    </Badge>
  )
}

export function SampleStatusBadge({ status }: { status: SampleStatus }) {
  const visual = SAMPLE_VISUALS[status]
  return (
    <Badge tone={visual.tone}>
      <StatusContent visual={visual} label={status} />
    </Badge>
  )
}

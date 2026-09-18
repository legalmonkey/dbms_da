import { useState } from 'react'
import { Table, TableWrap, Td, Th, Tr } from '@/components/data/Table'
import { EmptyState } from '@/components/data/EmptyState'
import { RemarkIndicator } from '@/components/domain/RemarkIndicator'
import { RolePill } from '@/components/domain/RolePill'
import { OrderStatusBadge, SampleStatusBadge } from '@/components/domain/StatusBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Surface, SurfaceHeader } from '@/components/ui/Surface'
import { Switch } from '@/components/ui/Switch'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { ORDER_STATUSES, REMARKS, ROLES, SAMPLE_STATUSES } from '@/types'

/** Developer reference for the design system. Not part of the product flow. */
export function StyleGuidePage() {
  const { toast } = useToast()
  const [checked, setChecked] = useState(true)
  const [enabled, setEnabled] = useState(false)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Design system"
        description="Every primitive and domain component, in the current theme."
      />

      <Surface>
        <SurfaceHeader title="Buttons" />
        <div className="flex flex-wrap items-center gap-2 p-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="subtle">Subtle</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button
            variant="primary"
            onClick={() => toast({ tone: 'success', title: 'Saved', description: 'Patient record updated.' })}
          >
            Show toast
          </Button>
        </div>
      </Surface>

      <Surface>
        <SurfaceHeader title="Form controls" />
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="First_Name" hint="As printed on government ID.">
            <Input placeholder="e.g. Kavya" />
          </Field>
          <Field label="Contact_No" error="Enter a valid 10-digit mobile number">
            <Input defaultValue="12345" />
          </Field>
          <Field label="Test_Category">
            <Select defaultValue="Pathology">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pathology">Pathology</SelectItem>
                <SelectItem value="Radiology">Radiology</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea placeholder="Clinical notes" />
          </Field>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-13">
              <Checkbox checked={checked} onCheckedChange={(value) => setChecked(value === true)} />
              Checkbox
            </label>
            <label className="flex items-center gap-2 text-13">
              <Switch checked={enabled} onCheckedChange={setEnabled} />
              Switch
            </label>
          </div>
        </div>
      </Surface>

      <Surface>
        <SurfaceHeader title="Domain indicators" description="Status and findings never rely on colour alone." />
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {ORDER_STATUSES.map((status) => (
              <OrderStatusBadge key={status} status={status} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_STATUSES.map((status) => (
              <SampleStatusBadge key={status} status={status} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {REMARKS.map((remark) => (
              <RemarkIndicator key={remark} remark={remark} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ROLES.map((role) => (
              <RolePill key={role} role={role} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">Neutral</Badge>
            <Badge tone="accent">Accent</Badge>
            <Badge tone="success">Success</Badge>
            <Badge tone="warning">Warning</Badge>
            <Badge tone="danger">Danger</Badge>
            <Badge tone="info">Info</Badge>
            <Badge tone="teal">Teal</Badge>
          </div>
        </div>
      </Surface>

      <Surface>
        <SurfaceHeader title="Table" />
        <TableWrap>
          <Table caption="Example table">
            <thead>
              <tr>
                <Th>Test_ID</Th>
                <Th>Test_Name</Th>
                <Th>Remark</Th>
                <Th numeric>Price</Th>
              </tr>
            </thead>
            <tbody>
              <Tr>
                <Td className="font-mono text-xs">T001</Td>
                <Td>Haemoglobin</Td>
                <Td>
                  <RemarkIndicator remark="Normal" />
                </Td>
                <Td numeric>180</Td>
              </Tr>
              <Tr>
                <Td className="font-mono text-xs">T005</Td>
                <Td>HbA1c</Td>
                <Td>
                  <RemarkIndicator remark="Critical" />
                </Td>
                <Td numeric>520</Td>
              </Tr>
            </tbody>
          </Table>
        </TableWrap>
      </Surface>

      <div className="grid gap-5 sm:grid-cols-2">
        <Surface>
          <SurfaceHeader title="Empty state" />
          <EmptyState title="No orders match this view" description="Try a different status filter." compact />
        </Surface>
        <Surface>
          <SurfaceHeader title="Loading" />
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-8" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        </Surface>
      </div>
    </div>
  )
}

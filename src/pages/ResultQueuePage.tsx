import { useQuery } from '@tanstack/react-query'
import { CheckCheck, Microscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/data/EmptyState'
import { QueryState } from '@/components/data/QueryState'
import { Table, TableWrap, Td, Th, Tr } from '@/components/data/Table'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { Surface } from '@/components/ui/Surface'
import { formatDate, formatDateTime } from '@/lib/format'
import { getPendingResults } from '@/services'

/**
 * Module 3: the pathologist's pending queue.
 *
 * Every row is a draft Report whose samples have already been collected, so
 * the order is ready to be read. Oldest collection first.
 */
export function ResultQueuePage() {
  const query = useQuery({ queryKey: ['pending-results'], queryFn: getPendingResults })

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Result entry"
        description="Orders whose samples are in and are waiting for observed values."
      />

      <Surface>
        <QueryState
          query={query}
          isEmpty={(data) => data.length === 0}
          empty={
            <EmptyState
              icon={CheckCheck}
              title="The queue is clear"
              description="Every collected sample has been reported."
              compact
            />
          }
          skeleton={
            <TableWrap>
              <Table>
                <tbody>
                  <SkeletonRows rows={6} columns={6} />
                </tbody>
              </Table>
            </TableWrap>
          }
        >
          {(items) => (
            <TableWrap>
              <Table caption="Orders awaiting result entry">
                <thead>
                  <tr>
                    <Th>Report_ID</Th>
                    <Th>Order_ID</Th>
                    <Th>Patient</Th>
                    <Th>Order_Date</Th>
                    <Th>Last collection</Th>
                    <Th numeric>Tests</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <Tr key={item.Report_ID}>
                      <Td className="font-mono text-xs">{item.Report_ID}</Td>
                      <Td className="font-mono text-xs">{item.Order_ID}</Td>
                      <Td>
                        <span className="font-medium text-fg">{item.Patient_Name}</span>
                        <span className="ml-2 font-mono text-2xs text-fg-muted">{item.Patient_ID}</span>
                      </Td>
                      <Td>{formatDate(item.Order_Date)}</Td>
                      <Td className="whitespace-nowrap">
                        {item.Last_Collection_DateTime
                          ? formatDateTime(item.Last_Collection_DateTime)
                          : '-'}
                      </Td>
                      <Td numeric>{item.Test_Count}</Td>
                      <Td className="text-right">
                        <Button size="sm" variant="primary" asChild>
                          <Link to={`/results/${item.Report_ID}`}>
                            <Microscope />
                            Enter results
                          </Link>
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </QueryState>
      </Surface>
    </div>
  )
}

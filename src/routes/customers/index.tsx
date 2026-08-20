import { createFileRoute, Link } from '@tanstack/react-router'
import { AuthGate } from '@/components/AuthGate'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export const Route = createFileRoute('/customers/')({
  component: CustomersPage,
})

interface Customer {
  id: string
  orgId: string
  companyName: string
  productType: 'Enterprise' | 'PAYG' | 'Pro' | 'Free'
}

const mockCustomers: Customer[] = [
  { id: '1', orgId: '550e8400-e29b-41d4-a716-446655440001', companyName: 'Acme Corporation', productType: 'Enterprise' },
  { id: '2', orgId: '550e8400-e29b-41d4-a716-446655440002', companyName: 'TechStart Inc.', productType: 'Pro' },
  { id: '3', orgId: '550e8400-e29b-41d4-a716-446655440003', companyName: 'Global Dynamics', productType: 'Enterprise' },
  { id: '4', orgId: '550e8400-e29b-41d4-a716-446655440004', companyName: 'StartupXYZ', productType: 'PAYG' },
  { id: '5', orgId: '550e8400-e29b-41d4-a716-446655440005', companyName: 'Local Business LLC', productType: 'Free' },
  { id: '6', orgId: '550e8400-e29b-41d4-a716-446655440006', companyName: 'Enterprise Solutions Co.', productType: 'Enterprise' },
  { id: '7', orgId: '550e8400-e29b-41d4-a716-446655440007', companyName: 'Digital Agency', productType: 'Pro' },
  { id: '8', orgId: '550e8400-e29b-41d4-a716-446655440008', companyName: 'Freelancer Hub', productType: 'PAYG' },
]

function ProductTypeBadge({ type }: { type: Customer['productType'] }) {
  const badgeStyles: Record<string, string> = {
    Enterprise: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    Pro: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    PAYG: 'bg-green-500/20 text-green-300 border-green-500/30',
    Free: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyles[type]}`}>
      {type}
    </span>
  )
}

function CustomersPage() {
  return (
    <AuthGate>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Customers</h1>
            <p className="text-muted-foreground mt-1">Manage and view customer organizations</p>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-card-foreground">Customer Organizations</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Company Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Org ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Product Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-card-foreground">{customer.companyName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground font-mono">{customer.orgId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ProductTypeBadge type={customer.productType} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to="/customers/$orgId"
                          params={{ orgId: customer.orgId }}
                          className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {(['Enterprise', 'Pro', 'PAYG', 'Free'] as const).map((type) => (
              <div key={type} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-accent/30">
                    <span className="text-2xl">{type === 'Enterprise' ? '🏢' : type === 'Pro' ? '⭐' : type === 'PAYG' ? '💰' : '🆓'}</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-muted-foreground">{type}</h3>
                    <p className="text-2xl font-semibold text-card-foreground">
                      {mockCustomers.filter((c) => c.productType === type).length}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </AuthGate>
  )
}

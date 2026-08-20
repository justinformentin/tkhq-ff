import { createFileRoute, Link } from '@tanstack/react-router'
import { AuthGate } from '@/components/AuthGate'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ArrowLeftIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

export const Route = createFileRoute('/customers/$orgId')({
  component: CustomerDetailPage,
})

interface CustomerDetails {
  orgId: string
  companyName: string
  productType: 'Enterprise' | 'PAYG' | 'Pro' | 'Free'
  email: string
  phone: string
  createdDate: string
  lastActive: string
}

interface RateLimitPolicy {
  id: string
  name: string
  limit: number
  window: string
  type: 'Default' | 'Override'
}

interface FeatureFlag {
  name: string
  enabled: boolean
  description: string
}

interface InterdictorBlock {
  id: string
  type: string
  reason: string
  timestamp: string
  status: 'Active' | 'Resolved'
}

function getMockCustomerData(orgId: string): CustomerDetails {
  const mockData: Record<string, CustomerDetails> = {
    '550e8400-e29b-41d4-a716-446655440001': {
      orgId, companyName: 'Acme Corporation', productType: 'Enterprise',
      email: 'admin@acme.com', phone: '+1 (555) 123-4567', createdDate: '2023-01-15', lastActive: '2024-01-20',
    },
    '550e8400-e29b-41d4-a716-446655440002': {
      orgId, companyName: 'TechStart Inc.', productType: 'Pro',
      email: 'info@techstart.com', phone: '+1 (555) 987-6543', createdDate: '2023-06-10', lastActive: '2024-01-19',
    },
  }
  return mockData[orgId] || {
    orgId, companyName: 'Unknown Organization', productType: 'Free',
    email: 'unknown@example.com', phone: 'N/A', createdDate: '2024-01-01', lastActive: '2024-01-01',
  }
}

const mockRateLimits: RateLimitPolicy[] = [
  { id: '1', name: 'API Requests', limit: 1000, window: 'per hour', type: 'Default' },
  { id: '2', name: 'Authentication Attempts', limit: 5, window: 'per minute', type: 'Override' },
  { id: '3', name: 'Data Export', limit: 10, window: 'per day', type: 'Default' },
  { id: '4', name: 'File Upload', limit: 50, window: 'per day', type: 'Override' },
]

const mockFeatureFlags: FeatureFlag[] = [
  { name: 'SMS', enabled: true, description: 'SMS messaging capabilities' },
  { name: 'OnRamp', enabled: true, description: 'Cryptocurrency on-ramp services' },
  { name: 'Auth Proxy', enabled: false, description: 'Authentication proxy services' },
]

const mockInterdictorBlocks: InterdictorBlock[] = [
  { id: '1', type: 'Suspicious Activity', reason: 'Multiple failed login attempts detected', timestamp: '2024-01-19 14:32:00', status: 'Resolved' },
  { id: '2', type: 'Rate Limit Exceeded', reason: 'API rate limit exceeded for 30 minutes', timestamp: '2024-01-18 09:15:00', status: 'Resolved' },
]

function ProductTypeBadge({ type }: { type: CustomerDetails['productType'] }) {
  const styles: Record<string, string> = {
    Enterprise: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    Pro: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    PAYG: 'bg-green-500/20 text-green-300 border-green-500/30',
    Free: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[type]}`}>{type}</span>
}

function StatusBadge({ status }: { status: 'Active' | 'Inactive' | 'Resolved' }) {
  const styles: Record<string, string> = {
    Active: 'bg-green-500/20 text-green-300 border-green-500/30',
    Inactive: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    Resolved: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>{status}</span>
}

function CustomerDetailPage() {
  const { orgId } = Route.useParams()
  const customer = getMockCustomerData(orgId)

  return (
    <AuthGate>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Link to="/customers" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to Customers</span>
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{customer.companyName}</h1>
              <p className="text-muted-foreground mt-1 font-mono">{customer.orgId}</p>
            </div>
            <ProductTypeBadge type={customer.productType} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Info */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-card-foreground mb-4">Customer Information</h2>
              <dl className="space-y-3">
                {[
                  ['Company Name', customer.companyName],
                  ['Organization ID', customer.orgId],
                  ['Product Type', customer.productType],
                  ['Email', customer.email],
                  ['Phone', customer.phone],
                  ['Created Date', customer.createdDate],
                  ['Last Active', customer.lastActive],
                ].map(([dt, dd]) => (
                  <div key={dt}>
                    <dt className="text-sm font-medium text-muted-foreground">{dt}</dt>
                    <dd className="text-sm text-card-foreground">{dd}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Rate Limits */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-card-foreground">Rate Limit Policies</h2>
                <button className="flex items-center space-x-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  <PlusIcon className="h-4 w-4" /><span>Add Override</span>
                </button>
              </div>
              <div className="space-y-4">
                {mockRateLimits.map((policy) => (
                  <div key={policy.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-card-foreground">{policy.name}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${policy.type === 'Override' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}>
                          {policy.type}
                        </span>
                      </div>
                      {policy.type === 'Override' && (
                        <button className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{policy.limit.toLocaleString()} {policy.window}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Flags */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-card-foreground">Feature Flags</h2>
                <button className="flex items-center space-x-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  <PlusIcon className="h-4 w-4" /><span>Activate Feature Flag</span>
                </button>
              </div>
              <div className="space-y-4">
                {mockFeatureFlags.map((flag) => (
                  <div key={flag.name} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-card-foreground">{flag.name}</h3>
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={flag.enabled ? 'Active' : 'Inactive'} />
                        {flag.enabled && (
                          <button className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{flag.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interdictor Blocks */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Interdictor Blocks</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-accent/50">
                  <tr>
                    {['Type', 'Reason', 'Timestamp', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockInterdictorBlocks.map((block) => (
                    <tr key={block.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-card-foreground">{block.type}</td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{block.reason}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">{block.timestamp}</td>
                      <td className="px-4 py-4 whitespace-nowrap"><StatusBadge status={block.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGate>
  )
}

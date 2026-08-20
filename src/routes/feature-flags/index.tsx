import { createFileRoute } from '@tanstack/react-router'
import { AuthGate } from '@/components/AuthGate'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export const Route = createFileRoute('/feature-flags/')({
  component: FeatureFlagsPage,
})

function FeatureFlagsPage() {
  return (
    <AuthGate>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Feature Flags</h1>
            <p className="text-muted-foreground mt-1">Manage feature flags across all customer organizations</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-12">
            <div className="text-center">
              <div className="text-6xl mb-4">🚩</div>
              <h2 className="text-xl font-semibold text-card-foreground mb-2">Feature Flags Management</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                This page will contain feature flag management capabilities including
                creating, updating, and monitoring feature flags across customer organizations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Total Flags', value: '12', icon: '🏁', bg: 'bg-blue-500/20' },
              { label: 'Active Flags', value: '8', icon: '✅', bg: 'bg-green-500/20' },
              { label: 'Recent Changes', value: '3', icon: '🔄', bg: 'bg-orange-500/20' },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bg}`}>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-muted-foreground">{stat.label}</h3>
                    <p className="text-2xl font-semibold text-card-foreground">{stat.value}</p>
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

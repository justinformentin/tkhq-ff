'use client'

import { useAuth, useUser, useUserGroups, useUserRoles } from '@/lib/auth/context'
import { getClientConfig } from '@/lib/config'
import { formatUserGroups, formatUserRoles } from '@/lib/auth/utils'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  icon: string
  iconBg: string
}

function StatCard({ title, value, icon, iconBg }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center">
        <div className={cn('flex-shrink-0 p-3 rounded-lg', iconBg)}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="text-2xl font-semibold text-card-foreground">{value}</p>
        </div>
      </div>
    </div>
  )
}

function EnvironmentBadge({ environment }: { environment: string }) {
  const badgeStyles = {
    local: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    dev: 'bg-green-500/20 text-green-300 border-green-500/30', 
    preprod: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    prod: 'bg-red-500/20 text-red-300 border-red-500/30'
  }
  
  const safeEnvironment = environment || 'local'
  const style = badgeStyles[safeEnvironment as keyof typeof badgeStyles] || badgeStyles.local
  
  return (
    <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border', style)}>
      {safeEnvironment.toUpperCase()}
    </span>
  )
}

export default function DashboardContent() {
  const { displayName } = useAuth()
  const user = useUser()
  const groups = useUserGroups()
  const roles = useUserRoles()
  const config = getClientConfig()

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {displayName}! Here's what's happening.
          </p>
        </div>
        <EnvironmentBadge environment={config.environment} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value="156"
          icon="🏢"
          iconBg="bg-blue-500/20"
        />
        <StatCard
          title="Active Feature Flags"
          value="8"
          icon="🚩"
          iconBg="bg-purple-500/20"
        />
        <StatCard
          title="Stripe Accounts"
          value="143"
          icon="💳"
          iconBg="bg-green-500/20"
        />
        <StatCard
          title="Rate Limit Violations"
          value="5"
          icon="⚠️"
          iconBg="bg-orange-500/20"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information Card */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">
            User Information
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Name</dt>
              <dd className="text-sm text-card-foreground">{user?.name || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd className="text-sm text-card-foreground">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">User ID</dt>
              <dd className="text-sm text-card-foreground font-mono">{user?.id}</dd>
            </div>
            {user?.preferred_username && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Username</dt>
                <dd className="text-sm text-card-foreground">{user.preferred_username}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Access Control Card */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">
            Access Control
          </h2>
          
          {/* Groups */}
          <div className="mb-4">
            <dt className="text-sm font-medium text-muted-foreground mb-2">Groups</dt>
            <dd className="flex flex-wrap gap-2">
              {groups.length > 0 ? (
                formatUserGroups(groups).map((group, index) => (
                  <span 
                    key={groups[index]} 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300"
                  >
                    {group}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No groups assigned</span>
              )}
            </dd>
          </div>

          {/* Roles */}
          <div>
            <dt className="text-sm font-medium text-muted-foreground mb-2">Roles</dt>
            <dd className="flex flex-wrap gap-2">
              {roles.length > 0 ? (
                formatUserRoles(roles).map((role, index) => (
                  <span 
                    key={roles[index]} 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300"
                  >
                    {role}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No roles assigned</span>
              )}
            </dd>
          </div>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Customer Growth</h3>
          <div className="h-64 bg-accent/20 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Chart placeholder - Customer growth metrics would go here</p>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">API Usage</h3>
          <div className="h-64 bg-accent/20 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Chart placeholder - API usage metrics would go here</p>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Recent Activity</h3>
          <div className="h-48 bg-accent/20 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Recent activity feed placeholder</p>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Environment Configuration</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Environment</dt>
              <dd className="text-sm text-card-foreground">{config.environment}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Application</dt>
              <dd className="text-sm text-card-foreground">{config.appName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Version</dt>
              <dd className="text-sm text-card-foreground">{config.version}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

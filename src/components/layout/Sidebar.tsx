import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'
import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/lib/auth/context'
import { Link, useRouterState } from '@tanstack/react-router'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Customers', href: '/customers', icon: UsersIcon },
  { name: 'Feature Flags', href: '/feature-flags', icon: CogIcon },
  { name: 'Stripe Sync', href: '/stripe-sync', icon: ChartBarIcon },
]

export function Sidebar({ isOpen = true, onClose, className }: SidebarProps) {
  const { logout } = useAuth()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  const isCurrentPath = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <Logo variant="light" size="sm" />
            </div>

            {/* Start Action Button */}
            <div className="px-4 mb-6">
              <button className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Start Action
              </button>
            </div>

            {/* Navigation */}
            <nav className="px-2 space-y-1">
              {navigation.map((item) => {
                const current = isCurrentPath(item.href)
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                      current
                        ? 'bg-accent text-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'mr-3 flex-shrink-0 h-5 w-5',
                        current
                          ? 'text-accent-foreground'
                          : 'text-muted-foreground group-hover:text-accent-foreground'
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Logout */}
          <div className="flex-shrink-0 p-4 border-t border-border">
            <button
              onClick={() => logout(false)}
              className="group flex items-center w-full px-2 py-2 text-sm font-medium text-sidebar-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-accent-foreground" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

'use client'

import { useAuth } from '@/lib/auth/context'
import { cn } from '@/lib/utils'
import { ChevronDownIcon, Bars3Icon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  onMenuToggle?: () => void
  className?: string
}

export function Header({ onMenuToggle, className }: HeaderProps) {
  const { isAuthenticated, displayName, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      router.push(`/customers/${searchValue.trim()}`)
    }
  }

  if (!isAuthenticated) {
    return (
      <header className={cn(
        'bg-header border-b border-border sticky top-0 z-50',
        className
      )}>
        <div className="px-6 py-4">
          {/* Logo removed - only in sidebar now */}
        </div>
      </header>
    )
  }

  return (
    <header className={cn(
      'bg-header border-b border-border sticky top-0 z-50',
      className
    )}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Menu toggle and search */}
        <div className="flex items-center space-x-4 flex-1 max-w-2xl">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-md text-sidebar-foreground hover:bg-accent transition-colors"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          )}
          
          {/* Customer Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Enter org ID..."
                className="block w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </form>
        </div>

        {/* Right side - User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-accent transition-colors"
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                {displayName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:block text-sm font-medium">
                {displayName || 'User'}
              </span>
            </div>
            <ChevronDownIcon className="h-4 w-4" />
          </button>

          {/* User dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-sm font-medium text-card-foreground">
                  {displayName || 'User'}
                </p>
              </div>
              <button
                onClick={() => {
                  logout(false)
                  setShowUserMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-card-foreground hover:bg-accent transition-colors"
              >
                Local Logout
              </button>
              <button
                onClick={() => {
                  logout(true)
                  setShowUserMenu(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-accent transition-colors"
              >
                Full Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

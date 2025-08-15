'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'light' | 'dark'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  xs: { width: 80, height: 18 },
  sm: { width: 120, height: 27 },
  md: { width: 164, height: 36 },
  lg: { width: 246, height: 54 }
}

export function Logo({ variant = 'light', size = 'md', className }: LogoProps) {
  const { width, height } = sizeMap[size]
  const logoSrc = variant === 'light' ? '/logos/logo-full-white.svg' : '/logos/logo-full-black.svg'
  
  return (
    <div className={cn('flex-shrink-0', className)} style={{ width, height }}>
      <Image
        src={logoSrc}
        alt="Admin Dashboard Logo"
        width={width}
        height={height}
        priority
        className="w-full h-full object-contain"
      />
    </div>
  )
}

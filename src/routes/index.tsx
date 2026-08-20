import { createFileRoute } from '@tanstack/react-router'
import { AuthGate } from '@/components/AuthGate'
import HomePage from '@/components/HomePage'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  return (
    <AuthGate>
      <HomePage />
    </AuthGate>
  )
}

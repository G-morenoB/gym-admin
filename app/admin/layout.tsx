import AdminSidebar from '@/components/AdminSidebar'

// Este layout ya no necesita 'use client' porque el sidebar
// está en su propio componente cliente separado
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  )
}
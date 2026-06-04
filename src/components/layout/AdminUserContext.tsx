'use client'

import { createContext, useContext } from 'react'

interface AdminUserContextType {
  userName: string
  userRole: string
}

const AdminUserContext = createContext<AdminUserContextType>({
  userName: 'Admin',
  userRole: 'ADMIN',
})

export function AdminUserProvider({
  children,
  userName,
  userRole,
}: {
  children: React.ReactNode
  userName: string
  userRole: string
}) {
  return (
    <AdminUserContext.Provider value={{ userName, userRole }}>
      {children}
    </AdminUserContext.Provider>
  )
}

export function useAdminUser() {
  return useContext(AdminUserContext)
}

'use client'

import { createContext, useContext } from 'react'

interface AdminUserContextType {
  userName: string
  userRole: string
  clubName?: string
  clubLogo?: string | null
}

const AdminUserContext = createContext<AdminUserContextType>({
  userName: 'Admin',
  userRole: 'ADMIN',
  clubName: 'MBC CRM',
  clubLogo: null,
})

export function AdminUserProvider({
  children,
  userName,
  userRole,
  clubName,
  clubLogo,
}: {
  children: React.ReactNode
  userName: string
  userRole: string
  clubName?: string
  clubLogo?: string | null
}) {
  return (
    <AdminUserContext.Provider value={{ userName, userRole, clubName, clubLogo }}>
      {children}
    </AdminUserContext.Provider>
  )
}

export function useAdminUser() {
  return useContext(AdminUserContext)
}

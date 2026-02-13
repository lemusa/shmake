import { AuthProvider } from '../context/AuthContext'
import AuthGuard from './AuthGuard'
import AdminLayout from './AdminLayout'

/**
 * Admin entry point — lazy-loaded from App.jsx.
 * AuthProvider + AuthGuard ensure nothing renders without a valid session.
 */
export default function AdminApp() {
  return (
    <AuthProvider>
      <AuthGuard>
        <AdminLayout />
      </AuthGuard>
    </AuthProvider>
  )
}

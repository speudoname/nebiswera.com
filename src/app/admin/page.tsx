import { prisma } from '@/lib/db'
import { Users, BadgeCheck, AlertCircle, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui'

// Force dynamic rendering - don't try to fetch from DB at build time
export const dynamic = 'force-dynamic'

async function getStats() {
  const [totalUsers, verifiedUsers, adminUsers, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerified: { not: null } } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
      },
    }),
  ])

  return {
    totalUsers,
    verifiedUsers,
    unverifiedUsers: totalUsers - verifiedUsers,
    adminUsers,
    recentUsers,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users className="h-6 w-6 text-primary-600" />}
        />
        <StatCard
          title="Verified Users"
          value={stats.verifiedUsers}
          icon={<BadgeCheck className="h-6 w-6 text-secondary-600" />}
        />
        <StatCard
          title="Unverified Users"
          value={stats.unverifiedUsers}
          icon={<AlertCircle className="h-6 w-6 text-primary-500" />}
        />
        <StatCard
          title="Admins"
          value={stats.adminUsers}
          icon={<ShieldCheck className="h-6 w-6 text-accent-700" />}
        />
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-neu shadow-neu">
        <div className="px-6 py-4 border-b border-neu-dark">
          <h2 className="text-lg font-semibold text-text-primary">Recent Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neu-dark">
            <thead className="bg-neu-light">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neu-dark">
              {stats.recentUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium text-sm">
                          {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-text-primary">
                          {user.name || 'No name'}
                        </div>
                        <div className="text-sm text-text-muted">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.emailVerified ? (
                      <Badge variant="success">Verified</Badge>
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-neu shadow-neu p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <p className="text-3xl font-bold text-text-primary mt-1">{value}</p>
        </div>
        <div className="h-12 w-12 bg-neu-light rounded-neu shadow-neu-sm flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  )
}

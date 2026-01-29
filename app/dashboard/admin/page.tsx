'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UserRow {
  id: string;
  email: string;
  role: string;
  creditsBalance: number;
  hasUnlimitedCredits: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  _count: { verifications: number };
}

interface Stats {
  totalUsers: number;
  totalVerifications: number;
  totalCreditsConsumed: number;
}

export default function AdminPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStats(await res.json());
    } catch {}
  }, [token]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.totalPages);
      }
    } catch {}
  }, [token, page, search]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    setActionLoading(true);
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: currentRole === 'ADMIN' ? 'USER' : 'ADMIN' }),
      });
      fetchUsers();
    } catch {}
    setActionLoading(false);
  };

  const handleUnlimitedToggle = async (userId: string, current: boolean) => {
    setActionLoading(true);
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hasUnlimitedCredits: !current }),
      });
      fetchUsers();
    } catch {}
    setActionLoading(false);
  };

  const handleCreditAdjust = async (userId: string) => {
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount === 0) return;
    setActionLoading(true);
    try {
      await fetch(`/api/admin/users/${userId}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, description: creditReason || undefined }),
      });
      setCreditAmount('');
      setCreditReason('');
      setEditingUser(null);
      fetchUsers();
      fetchStats();
    } catch {}
    setActionLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      </div>
    );
  }

  if (user?.role !== 'ADMIN') return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage users, credits, and system configuration</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Users</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{stats.totalUsers}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Verifications</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{stats.totalVerifications}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Credits Consumed</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{stats.totalCreditsConsumed.toLocaleString()}</p></CardContent>
          </Card>
        </div>
      )}

      {/* Users */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users</CardTitle>
            <div className="w-64">
              <Input
                placeholder="Search by email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Credits</th>
                  <th className="pb-2 font-medium">Verifications</th>
                  <th className="pb-2 font-medium">Joined</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="py-3">{u.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3">
                      {u.hasUnlimitedCredits ? (
                        <span className="text-green-600 font-medium">Unlimited</span>
                      ) : (
                        u.creditsBalance.toLocaleString()
                      )}
                    </td>
                    <td className="py-3">{u._count.verifications}</td>
                    <td className="py-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() => handleRoleToggle(u.id, u.role)}
                      >
                        {u.role === 'ADMIN' ? 'Demote' : 'Promote'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() => handleUnlimitedToggle(u.id, u.hasUnlimitedCredits)}
                      >
                        {u.hasUnlimitedCredits ? 'Cap Credits' : 'Unlimited'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingUser(editingUser === u.id ? null : u.id)}
                      >
                        Adjust Credits
                      </Button>
                      {editingUser === u.id && (
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            type="number"
                            placeholder="Amount (e.g. 500 or -100)"
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(e.target.value)}
                            className="w-40"
                          />
                          <Input
                            placeholder="Reason (optional)"
                            value={creditReason}
                            onChange={(e) => setCreditReason(e.target.value)}
                            className="w-48"
                          />
                          <Button
                            size="sm"
                            disabled={actionLoading || !creditAmount}
                            onClick={() => handleCreditAdjust(u.id)}
                          >
                            Apply
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

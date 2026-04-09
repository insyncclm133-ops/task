import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, UserX, X, Users, Search } from 'lucide-react';
import type { UserRole, AppRole } from '@/types/user';
import { APP_ROLES, getRoleBadgeColor } from '@/types/user';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export function UserManagementPage() {
  const { profile } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('user_roles')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setUserRoles(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = () => {
    setEditingUser(null);
    setError(null);
    setDialogOpen(true);
  };

  const handleEdit = (userRole: UserRole) => {
    setEditingUser(userRole);
    setError(null);
    setDialogOpen(true);
  };

  const handleDeactivate = async (userRole: UserRole) => {
    if (!confirm(`Are you sure you want to deactivate ${userRole.profiles?.full_name || 'this user'}?`)) {
      return;
    }

    try {
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('id', userRole.id);

      if (roleError) throw roleError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userRole.user_id);

      if (profileError) throw profileError;

      await fetchUsers();
    } catch (err) {
      console.error('Error deactivating user:', err);
      alert('Failed to deactivate user.');
    }
  };

  const handleSubmit = async (formData: UserFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingUser) {
        // Update user
        const { error: invokeError } = await supabase.functions.invoke('manage-user', {
          method: 'PUT',
          body: {
            action: 'update-user',
            user_id: editingUser.user_id,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            role: formData.role,
            department: formData.department || null,
          },
        });

        if (invokeError) throw invokeError;
      } else {
        // Create user
        const { error: invokeError } = await supabase.functions.invoke('manage-user', {
          method: 'POST',
          body: {
            action: 'create-user',
            email: formData.email,
            password: formData.password,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            role: formData.role,
            department: formData.department || null,
          },
        });

        if (invokeError) throw invokeError;
      }

      setDialogOpen(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = userRoles.filter((ur) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = ur.profiles?.full_name?.toLowerCase() || '';
    const email = ur.profiles?.email?.toLowerCase() || '';
    return name.includes(query) || email.includes(query);
  });

  const isAdminUser =
    profile?.is_platform_admin ||
    userRoles.some(
      (ur) => ur.user_id === profile?.id && (ur.role === 'platform_admin' || ur.role === 'admin'),
    );

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading users...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">User Management</h1>
        </div>
        {isAdminUser && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Phone</th>
                <th className="text-left px-4 py-3 font-medium">Department</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                {isAdminUser && <th className="text-right px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={isAdminUser ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((ur) => (
                  <tr key={ur.id} className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{ur.profiles?.full_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ur.profiles?.email || 'N/A'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ur.profiles?.phone || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ur.profiles?.department || '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(ur.role)}`}
                      >
                        {APP_ROLES.find((r) => r.value === ur.role)?.label || ur.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          ur.is_active
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}
                      >
                        {ur.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {isAdminUser && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(ur)}
                            className="p-1.5 rounded-md hover:bg-muted"
                            title="Edit user"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {ur.is_active && (
                            <button
                              onClick={() => handleDeactivate(ur)}
                              className="p-1.5 rounded-md hover:bg-muted text-red-600"
                              title="Deactivate user"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Dialog */}
      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
      />
    </motion.div>
  );
}

// ---- User Dialog ----

interface UserFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  department: string;
  role: AppRole;
}

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserRole | null;
  onSubmit: (data: UserFormData) => void;
  isSubmitting: boolean;
  error: string | null;
}

function UserDialog({ open, onOpenChange, user, onSubmit, isSubmitting, error }: UserDialogProps) {
  const isEditing = !!user;

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    department: '',
    role: 'sales_agent',
  });

  useEffect(() => {
    if (user?.profiles) {
      setFormData({
        email: user.profiles.email || '',
        password: '',
        first_name: user.profiles.first_name || '',
        last_name: user.profiles.last_name || '',
        phone: user.profiles.phone || '',
        department: user.profiles.department || '',
        role: user.role,
      });
    } else {
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        department: '',
        role: 'sales_agent',
      });
    }
  }, [user, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{isEditing ? 'Edit User' : 'Create User'}</h2>
          <button onClick={() => onOpenChange(false)} className="p-1 rounded-md hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Email (only for create) */}
          {!isEditing && (
            <div>
              <label className="text-sm font-medium">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="user@example.com"
              />
            </div>
          )}

          {/* Password (only for create) */}
          {!isEditing && (
            <div>
              <label className="text-sm font-medium">Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Minimum 6 characters"
              />
            </div>
          )}

          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">First Name *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData((p) => ({ ...p, first_name: e.target.value }))}
                className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Last Name *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData((p) => ({ ...p, last_name: e.target.value }))}
                className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-medium">Phone (WhatsApp) *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="919876543210"
            />
          </div>

          {/* Department */}
          <div>
            <label className="text-sm font-medium">Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))}
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g., Sales, Operations, Engineering"
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-sm font-medium">Role *</label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value as AppRole }))}
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {APP_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium rounded-md border border-input hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

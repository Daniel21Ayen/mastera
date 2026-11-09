'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminsRolesManager } from '@/components/admins/AdminsRolesManager';
import { AdminUserDto } from '@mastera/contracts';
import { adminApiFetch } from '@/lib/api-client';

export default function AdminsManagementPage(): React.ReactElement {
  const [admins, setAdmins] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApiFetch<any[]>('/admin/users');
      if (Array.isArray(res)) {
        const loaded: AdminUserDto[] = res.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          adminRole: u.adminRole,
          totpEnabled: Boolean(u.totpSecret),
          isActive: u.isActive,
          lastLoginAt: '2026-11-07T14:10:00Z',
          scopes: [],
        }));
        setAdmins(loaded);
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  return (
    <AdminsRolesManager
      currentAdminId={admins[0]?.id || '00000000-0000-0000-0000-000000000001'}
      admins={admins}
      onCreateAdmin={() => {}}
      onConfigure2fa={(adminId) => {
        setAdmins((prev) =>
          prev.map((a) => (a.id === adminId ? { ...a, totpEnabled: true } : a))
        );
      }}
      onEditAdmin={() => {}}
      onDeleteAdmin={(adminId) => {
        setAdmins((prev) => prev.filter((a) => a.id !== adminId));
      }}
    />
  );
}

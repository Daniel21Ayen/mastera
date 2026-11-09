import React, { useState } from 'react';
import { AdminRole, AdminUserDto } from '@mastera/contracts';
import {
  ADMIN_THEMES,
  RADIUS,
  SPACING,
  ThemeMode,
} from '@mastera/ui-tokens';

export interface AdminsRolesManagerProps {
  currentAdminId: string;
  admins: AdminUserDto[];
  onCreateAdmin: () => void;
  onConfigure2fa: (adminId: string) => void;
  onEditAdmin: (adminId: string) => void;
  onDeleteAdmin: (adminId: string) => void;
  themeMode?: ThemeMode;
}

export function AdminsRolesManager({
  currentAdminId,
  admins,
  onCreateAdmin,
  onConfigure2fa,
  onEditAdmin,
  onDeleteAdmin,
  themeMode = 'light',
}: AdminsRolesManagerProps): React.ReactElement {
  const [roleFilter, setRoleFilter] = useState<'ALL' | AdminRole>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const tokens = ADMIN_THEMES[themeMode];

  const superAdminsCount = admins.filter(
    (a) => a.adminRole === 'SUPER_ADMIN' && a.isActive
  ).length;
  const academicAdminsCount = admins.filter(
    (a) => a.adminRole === 'ACADEMIC_ADMIN'
  ).length;
  const opsAdminsCount = admins.filter(
    (a) => a.adminRole === 'OPERATIONS_ADMIN'
  ).length;

  const filteredAdmins = admins.filter((a) => {
    if (roleFilter !== 'ALL' && a.adminRole !== roleFilter) return false;
    if (
      searchQuery &&
      !a.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !a.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: 4, fontSize: 26 }}>
        Admins & Roles
      </h1>
      <p
        style={{
          marginTop: 0,
          marginBottom: SPACING.lg,
          color: tokens.textMuted,
          fontSize: 13,
        }}
      >
        Manage platform administrator accounts, role assignments, and
        multi-factor authentication.
      </p>

      {/* 4 KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: SPACING.md,
          marginBottom: SPACING.lg,
        }}
      >
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
          }}
        >
          <div style={{ fontSize: 13, color: tokens.textMuted }}>
            Total Administrators
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, margin: '8px 0' }}>
            {admins.length}
          </div>
          <div style={{ fontSize: 12, color: tokens.textMuted }}>
            Configured admin accounts
          </div>
        </div>

        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
          }}
        >
          <div style={{ fontSize: 13, color: tokens.textMuted }}>
            Super Admins
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, margin: '8px 0' }}>
            {superAdminsCount}
          </div>
          <div style={{ fontSize: 12, color: tokens.textMuted }}>
            Full system authority
          </div>
        </div>

        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
          }}
        >
          <div style={{ fontSize: 13, color: tokens.textMuted }}>
            Academic Admins
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, margin: '8px 0' }}>
            {academicAdminsCount}
          </div>
          <div style={{ fontSize: 12, color: tokens.textMuted }}>
            Courses, content & quizzes
          </div>
        </div>

        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
          }}
        >
          <div style={{ fontSize: 13, color: tokens.textMuted }}>
            Operations Admins
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, margin: '8px 0' }}>
            {opsAdminsCount}
          </div>
          <div style={{ fontSize: 12, color: tokens.textMuted }}>
            Students, payments & support
          </div>
        </div>
      </div>

      {/* Filter Bar + New Administrator Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
          marginBottom: SPACING.md,
        }}
      >
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, or phone..."
          style={{ width: 360, padding: SPACING.sm }}
        />

        <div style={{ display: 'flex', gap: SPACING.sm }}>
          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value as 'ALL' | AdminRole)
            }
            style={{ padding: SPACING.sm }}
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ACADEMIC_ADMIN">Academic Admin</option>
            <option value="OPERATIONS_ADMIN">Operations Admin</option>
          </select>

          <button
            type="button"
            onClick={onCreateAdmin}
            style={{
              padding: `${SPACING.sm}px ${SPACING.lg}px`,
              borderRadius: RADIUS.md,
              border: 'none',
              backgroundColor: tokens.primary,
              color: tokens.sidebarText,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + New Administrator
          </button>
        </div>
      </div>

      {/* Administrators Table */}
      <div
        style={{
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
          borderRadius: RADIUS.lg,
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                borderBottom: `1px solid ${tokens.border}`,
                textAlign: 'left',
                fontSize: 12,
                color: tokens.textMuted,
              }}
            >
              <th style={{ padding: SPACING.md }}>ADMINISTRATOR</th>
              <th style={{ padding: SPACING.md }}>ROLE</th>
              <th style={{ padding: SPACING.md }}>STATUS</th>
              <th style={{ padding: SPACING.md }}>2FA (TOTP)</th>
              <th style={{ padding: SPACING.md }}>LAST LOGIN</th>
              <th style={{ padding: SPACING.md, textAlign: 'right' }}>
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.map((admin) => {
              const isSelf = admin.id === currentAdminId;
              const isLastSuperAdmin =
                admin.adminRole === 'SUPER_ADMIN' &&
                admin.isActive &&
                superAdminsCount <= 1;
              const disableDelete = isSelf || isLastSuperAdmin;

              return (
                <tr
                  key={admin.id}
                  style={{ borderBottom: `1px solid ${tokens.border}` }}
                >
                  <td style={{ padding: SPACING.md }}>
                    <div style={{ fontWeight: 700 }}>{admin.name}</div>
                    <div style={{ fontSize: 12, color: tokens.textMuted }}>
                      {admin.email}
                    </div>
                  </td>
                  <td style={{ padding: SPACING.md }}>
                    <span
                      style={{
                        padding: `4px ${SPACING.sm}px`,
                        borderRadius: RADIUS.pill,
                        backgroundColor: tokens.surfaceSubtle,
                        color: tokens.primary,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {admin.adminRole.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: SPACING.md }}>
                    <span
                      style={{
                        color: admin.isActive
                          ? tokens.success
                          : tokens.textMuted,
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      ● {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: SPACING.md }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {admin.totpEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: SPACING.md, fontSize: 13 }}>
                    {admin.lastLoginAt ?? 'Never'}
                  </td>
                  <td style={{ padding: SPACING.md, textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        gap: SPACING.xs,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onConfigure2fa(admin.id)}
                        style={{
                          padding: `4px ${SPACING.sm}px`,
                          borderRadius: RADIUS.sm,
                          border: `1px solid ${tokens.border}`,
                          backgroundColor: tokens.surface,
                          cursor: 'pointer',
                        }}
                      >
                        2FA
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditAdmin(admin.id)}
                        style={{
                          padding: `4px ${SPACING.sm}px`,
                          borderRadius: RADIUS.sm,
                          border: `1px solid ${tokens.border}`,
                          backgroundColor: tokens.surface,
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={disableDelete}
                        onClick={() => onDeleteAdmin(admin.id)}
                        title={
                          disableDelete
                            ? 'FR-G63: Cannot delete own account or the last active Super Admin'
                            : 'Delete administrator'
                        }
                        style={{
                          padding: `4px ${SPACING.sm}px`,
                          borderRadius: RADIUS.sm,
                          border: 'none',
                          backgroundColor: tokens.dangerBg,
                          color: tokens.danger,
                          fontWeight: 600,
                          opacity: disableDelete ? 0.4 : 1,
                          cursor: disableDelete ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
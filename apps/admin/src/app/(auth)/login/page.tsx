'use client';

import React, { useState } from 'react';
import { ADMIN_THEMES, SPACING, RADIUS } from '@mastera/ui-tokens';

export default function AdminLoginPage(): React.ReactElement {
  const tokens = ADMIN_THEMES.light;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [step2Fa, setStep2Fa] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!step2Fa) {
      setStep2Fa(true);
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tokens.background,
        color: tokens.textPrimary,
        padding: SPACING.lg,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: tokens.surface,
          borderRadius: RADIUS.xl,
          border: `1px solid ${tokens.border}`,
          padding: SPACING.xl,
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: SPACING.xl }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: tokens.primary,
              margin: 0,
            }}
          >
            Mastera Admin Portal
          </h1>
          <p
            style={{
              fontSize: 13,
              color: tokens.textMuted,
              marginTop: SPACING.xs,
            }}
          >
            Role-Based Access Control & Content Governance
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {!step2Fa ? (
            <>
              <div style={{ marginBottom: SPACING.md }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mastera.edu.et"
                  style={{
                    width: '100%',
                    padding: SPACING.md,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.background,
                    color: tokens.textPrimary,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: SPACING.lg }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: SPACING.md,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.background,
                    color: tokens.textPrimary,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: SPACING.md,
                  backgroundColor: tokens.primary,
                  color: tokens.surface,
                  borderRadius: RADIUS.md,
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Sign In →
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  padding: SPACING.md,
                  backgroundColor: tokens.warningBg,
                  borderRadius: RADIUS.md,
                  marginBottom: SPACING.lg,
                  fontSize: 13,
                  color: tokens.warning,
                  border: `1px solid ${tokens.warning}`,
                }}
              >
                <strong>TOTP 2FA Verification Required</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12 }}>
                  Enter the 6-digit verification code from Google Authenticator
                  or your registered TOTP device (Section 4.3).
                </p>
              </div>

              <div style={{ marginBottom: SPACING.lg }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="123456"
                  style={{
                    width: '100%',
                    padding: SPACING.md,
                    textAlign: 'center',
                    fontSize: 20,
                    letterSpacing: 4,
                    fontWeight: 700,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.background,
                    color: tokens.textPrimary,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: SPACING.md,
                  backgroundColor: tokens.primary,
                  color: tokens.surface,
                  borderRadius: RADIUS.md,
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Verify & Complete Login
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

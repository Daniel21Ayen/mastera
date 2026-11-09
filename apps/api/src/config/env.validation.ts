export interface ApiEnvironmentConfig {
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  entitlementSigningSecret: string;
  allowedOrigins: string[];
  s3BucketName: string;
  port: number;
}

const MIN_SECRET_LENGTH = 32;

const FORBIDDEN_DEFAULT_SECRETS = new Set([
  'changeme',
  'secret',
  'default_secret_key_must_be_changed_in_prod',
  '12345678901234567890123456789012',
]);

export function validateEnvironmentOrExit(
  env: NodeJS.ProcessEnv = process.env
): ApiEnvironmentConfig {
  const databaseUrl = env['DATABASE_URL']?.trim() ?? '';
  const jwtAccessSecret = env['JWT_ACCESS_SECRET']?.trim() ?? '';
  const jwtRefreshSecret = env['JWT_REFRESH_SECRET']?.trim() ?? '';
  const entitlementSigningSecret =
    env['ENTITLEMENT_SIGNING_SECRET']?.trim() ?? '';
  const rawOrigins = env['CORS_ALLOWED_ORIGINS']?.trim() ?? '';
  const s3BucketName = env['S3_BUCKET_NAME']?.trim() ?? '';

  if (!databaseUrl) {
    throw new Error('FATAL [Section 14]: DATABASE_URL is required.');
  }

  for (const [name, secret] of [
    ['JWT_ACCESS_SECRET', jwtAccessSecret],
    ['JWT_REFRESH_SECRET', jwtRefreshSecret],
    ['ENTITLEMENT_SIGNING_SECRET', entitlementSigningSecret],
  ] as const) {
    if (
      secret.length < MIN_SECRET_LENGTH ||
      FORBIDDEN_DEFAULT_SECRETS.has(secret.toLowerCase())
    ) {
      throw new Error(
        `FATAL [Section 14]: ${name} must be at least ${MIN_SECRET_LENGTH} characters and not a default value.`
      );
    }
  }

  const allowedOrigins = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (allowedOrigins.length === 0) {
    throw new Error(
      'FATAL [Section 14]: CORS_ALLOWED_ORIGINS must specify at least one explicit origin.'
    );
  }

  if (!s3BucketName) {
    throw new Error('FATAL [Section 14]: S3_BUCKET_NAME is required.');
  }

  const port = Number(env['PORT'] ?? '3000');

  return {
    databaseUrl,
    jwtAccessSecret,
    jwtRefreshSecret,
    entitlementSigningSecret,
    allowedOrigins,
    s3BucketName,
    port: Number.isFinite(port) && port > 0 ? port : 3000,
  };
}
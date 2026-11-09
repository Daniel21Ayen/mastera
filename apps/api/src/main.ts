import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';

// Automatically load .env if running via plain "node dist/main.js"
function loadEnv() {
  if (typeof (process as any).loadEnvFile === 'function') {
    try {
      (process as any).loadEnvFile();
      return;
    } catch {}
  }
  const candidatePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '.env'),
  ];
  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eq = trimmed.indexOf('=');
          if (eq !== -1) {
            const key = trimmed.slice(0, eq).trim();
            let val = trimmed.slice(eq + 1).trim();
            if (
              (val.startsWith('"') && val.endsWith('"')) ||
              (val.startsWith("'") && val.endsWith("'"))
            ) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
        break;
      } catch {}
    }
  }
}

loadEnv();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validateEnvironmentOrExit } from './config/env.validation';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';

async function bootstrap() {
  const envConfig = validateEnvironmentOrExit(process.env);

  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new DomainExceptionFilter());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(envConfig.port, '0.0.0.0');
  console.log(`[Mastera API] Running on http://localhost:${envConfig.port}`);
}

if (require.main === module) {
  bootstrap().catch((err) => {
    console.error('Fatal API bootstrap error:', err);
    process.exit(1);
  });
}

export { bootstrap };

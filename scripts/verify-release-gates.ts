import { runAllReleaseGateChecks } from '../apps/api/src/common/verify-release-gates';

export * from '../apps/api/src/common/verify-release-gates';

if (require.main === module) {
  runAllReleaseGateChecks();
}

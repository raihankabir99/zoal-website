import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('production server code must not depend on process-lifetime interval workers', () => {
  const serverFiles = [
    'app.ts',
    'server/ai_translations.ts',
    'server/health_monitor.ts',
  ];

  for (const file of serverFiles) {
    const source = read(file);
    assert.doesNotMatch(
      source,
      /(^|\n)\s*setInterval\s*\(/m,
      `${file} contains a process-lifetime setInterval; move scheduled work to an external cron/queue before production.`
    );
  }
});

test('browser/UI intervals remain scoped to component lifecycle', () => {
  const uiFiles = [
    'src/components/Hero.tsx',
    'src/components/OTPVerificationView.tsx',
    'src/components/EnterpriseHealthMonitor.tsx',
  ];

  for (const file of uiFiles) {
    const source = read(file);
    if (source.includes('setInterval(')) {
      assert.match(source, /clearInterval\(/, `${file} creates a UI interval without a cleanup call.`);
    }
  }
});

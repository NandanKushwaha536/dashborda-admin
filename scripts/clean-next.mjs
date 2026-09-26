import { rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const nextDir = resolve(process.cwd(), '.next');
if (existsSync(nextDir)) {
  try {
    rmSync(nextDir, { recursive: true, force: true });
    console.log('Cleaned .next directory.');
  } catch (err) {
    console.warn('Could not clean .next directory:', err);
  }
}

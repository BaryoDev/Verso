import { execSync } from 'child_process'

// The tests launch out/main, so build first and never test a stale bundle.
export default function globalSetup() {
  execSync('npx electron-vite build', { stdio: 'inherit' })
}

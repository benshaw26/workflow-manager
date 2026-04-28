export async function register() {
  // Only run in Node.js runtime (not Edge), and only on server startup
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { seedAdminIfNeeded } = await import('./lib/adminInit')
    await seedAdminIfNeeded()
  }
}

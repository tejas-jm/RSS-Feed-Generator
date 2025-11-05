import { registerSchedules } from './scheduler';

const globalState = globalThis as unknown as { schedulerInitialized?: boolean };

export async function ensureScheduler() {
  if (globalState.schedulerInitialized) return;
  await registerSchedules();
  globalState.schedulerInitialized = true;
}

import { getServerSession } from 'next-auth';
import { authOptions } from './options';

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

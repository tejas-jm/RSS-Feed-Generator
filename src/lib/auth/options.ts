import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';

const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: adminEmail },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const emailMatches = credentials.email === adminEmail;
        if (!emailMatches) return null;
        if (adminPassword.startsWith('$2')) {
          const valid = await compare(credentials.password, adminPassword);
          if (!valid) return null;
        } else if (credentials.password !== adminPassword) {
          return null;
        }
        return {
          id: 'admin',
          email: adminEmail,
          name: 'Administrator',
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/sign-in',
  },
};

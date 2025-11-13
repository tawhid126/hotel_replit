import { PrismaAdapter } from "@auth/prisma-adapter";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import { type Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";

import { env } from "~/env";
import { db } from "~/server/db";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
        role: token.role,
      },
    }),
    jwt: ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.sub = user.id;
      }
      return token;
    },
  },
  // Remove adapter when using CredentialsProvider with JWT
  // adapter: PrismaAdapter(db) as Adapter,
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: env.NEXTAUTH_SECRET,
};

export const getServerAuthSession = async (ctx?: {
  req?: any;
  res?: any;
}) => {
  if (!ctx?.req) {
    return null;
  }
  
  if (ctx.res) {
    return getServerSession(ctx.req, ctx.res, authOptions);
  }
  
  try {
    const sessionToken = ctx.req.cookies?.get?.('next-auth.session-token')?.value || 
                        ctx.req.cookies?.get?.('__Secure-next-auth.session-token')?.value ||
                        ctx.req.cookies?.['next-auth.session-token'] ||
                        ctx.req.cookies?.['__Secure-next-auth.session-token'];
    
    if (!sessionToken) {
      return null;
    }
    
    const session = await db.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    });
    
    if (!session || session.expires < new Date()) {
      return null;
    }
    
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        role: session.user.role,
      },
      expires: session.expires.toISOString(),
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'hospital',
      name: 'Hospital',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const hospital = await prisma.hospital.findUnique({
          where: { email: credentials.email }
        })

        if (!hospital) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          hospital.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: hospital.id,
          email: hospital.email,
          name: hospital.name,
          role: 'hospital'
        }
      }
    }),
    CredentialsProvider({
      id: 'courier',
      name: 'Courier',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const courier = await prisma.courier.findUnique({
          where: { email: credentials.email }
        })

        if (!courier) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          courier.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: courier.id,
          email: courier.email,
          name: courier.name,
          role: 'courier'
        }
      }
    }),
    CredentialsProvider({
      id: 'admin',
      name: 'Admin',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email }
        })

        if (!admin) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          admin.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: 'admin'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET
}

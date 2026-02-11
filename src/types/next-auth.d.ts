import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'hospital' | 'admin'
    } & DefaultSession['user']
  }

  interface User {
    role: 'hospital' | 'admin'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'hospital' | 'admin'
  }
}

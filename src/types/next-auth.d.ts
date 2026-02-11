import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'hospital' | 'courier' | 'admin'
    } & DefaultSession['user']
  }

  interface User {
    role: 'hospital' | 'courier' | 'admin'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'hospital' | 'courier' | 'admin'
  }
}

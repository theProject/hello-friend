import NextAuth from "next-auth/next"
import { authOptions } from "@/lib/authOptions"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

// This file handles authentication requests for NextAuth.js.
// It exports a handler that processes GET and POST requests for authentication.

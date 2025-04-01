import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

// Only export your HTTP method handlers
export { handler as GET, handler as POST }

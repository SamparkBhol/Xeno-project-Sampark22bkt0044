import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    // We are using the "Credentials" provider, which allows for email/password login.
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "test@xeno.com" },
        password: { label: "Password", type: "password" }
      },
      // This is the core logic that runs when a user tries to log in.
      async authorize(credentials, req) {
        // For this assignment, we don't need a real user database.
        // We will just accept a specific hard-coded email and password.
        // In a real-world app, you would query your database here to find the user.
        if (credentials?.email === 'test@xeno.com' && credentials?.password === 'password123') {
          // If the credentials are correct, return a user object.
          // This object will be stored in the session token.
          return { id: "1", name: "Xeno Intern", email: "test@xeno.com" }
        }
        
        // If credentials are not correct, return null to deny access.
        return null
      }
    })
  ],
  // We need to define a custom login page URL.
  pages: {
    signIn: '/login',
  },
  // Use JWT for session strategy
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
});

export { handler as GET, handler as POST }

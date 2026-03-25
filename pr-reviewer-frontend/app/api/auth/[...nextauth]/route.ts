import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
      // 🛡️ Bypasses security 'state' mismatch during App installs
      checks: ['none'], 
      // 🌍 Explicitly define the GitHub OAuth endpoints
      authorization: {
        params: { scope: "read:user user:email" },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, profile }: any) {
      if (profile) {
        token.username = profile.login;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        // @ts-ignore
        session.user.username = token.username;
      }
      return session;
    },
  },
  // 🔍 This will print the RAW error from GitHub in your terminal
  debug: true, 
});

export { handler as GET, handler as POST };
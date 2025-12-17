import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null;

                const user = await db.user.findUnique({
                    where: { username: credentials.username },
                });

                // For simplicity, we are doing plain text comparison as requested.
                // In production, use bcrypt.
                if (user && user.password === credentials.password) {
                    return { id: user.id, name: user.username, role: user.role };
                }
                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.sub;
            }
            return session;
        },
    },
    session: { strategy: "jwt" },
    pages: { signIn: "/login" },
};

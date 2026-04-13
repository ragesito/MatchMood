import 'dotenv/config';
import passport from 'passport';
import { Strategy as GitHubStrategy, Profile } from 'passport-github2';
import { VerifyCallback } from 'passport-oauth2';
import prisma from './prisma';

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3000'}/auth/github/callback`,
      scope: ['user:email'],
    },
    async (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
      try {
        const githubId = profile.id;
        const githubUsername = profile.username ?? null;
        const username = githubUsername ?? `user_${githubId}`;
        const avatarUrl = profile.photos?.[0]?.value ?? null;
        const email = profile.emails?.[0]?.value ?? null;

        // Upsert: create user if not exists, update avatar/email/githubUsername on login
        const user = await prisma.user.upsert({
          where: { githubId },
          update: { avatarUrl, email, githubUsername },
          create: { githubId, githubUsername, username, avatarUrl, email },
        });

        return done(null, { userId: user.id, username: user.username });
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

export default passport;

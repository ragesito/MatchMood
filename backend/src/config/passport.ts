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
        const avatarUrl = profile.photos?.[0]?.value ?? null;
        const email = profile.emails?.[0]?.value ?? null;

        // Resolve the account WITHOUT ever hitting a unique-constraint crash
        // ("Resource already exists"). username and email are both @unique, so a
        // plain upsert-by-githubId throws P2002 whenever a row with the same
        // username/email already exists under a different (or missing) githubId.
        //   1) Canonical identity: the GitHub id.
        //   2) Fallback: an account created earlier with the same email but not
        //      yet linked to this GitHub id — link it instead of duplicating.
        let user = await prisma.user.findUnique({ where: { githubId } });
        if (!user && email) {
          user = await prisma.user.findUnique({ where: { email } });
        }

        if (user) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { githubId, avatarUrl, githubUsername, ...(email ? { email } : {}) },
          });
        } else {
          // Brand-new user. The GitHub handle may already be taken as a
          // username, so guarantee a unique one before creating.
          const base = githubUsername ?? `user_${githubId}`;
          let username = base;
          while (await prisma.user.findUnique({ where: { username } })) {
            username = `${base}_${Math.floor(Math.random() * 100000)}`;
          }
          user = await prisma.user.create({
            data: { githubId, githubUsername, username, avatarUrl, email },
          });
        }

        return done(null, { userId: user.id, username: user.username });
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

export default passport;

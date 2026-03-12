const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const findOrCreateUser = async (profile, provider) => {
  const email = profile.emails?.[0]?.value || `${provider}-${profile.id}@noemail.invalid`;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      email,
      name: profile.displayName || profile.username || email.split('@')[0],
      avatar: profile.photos?.[0]?.value || null,
      provider,
      providerId: profile.id,
    },
  });
};

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `https://carefree-vitality-production-70f0.up.railway.app/api/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await findOrCreateUser(profile, 'google');
    done(null, user);
  } catch (e) { done(e); }
}));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/api/auth/github/callback`,
  scope: ['user:email'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await findOrCreateUser(profile, 'github');
    done(null, user);
  } catch (e) { done(e); }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (e) { done(e); }
});

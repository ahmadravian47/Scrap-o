const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
  passReqToCallback: true,
  scope: ['profile', 'email'],
  state: true
}, async (req, accessToken, refreshToken, profile, done) => {
  const emailObj = profile.emails && profile.emails[0];
  if (!emailObj || !emailObj.verified) {
    return done(new Error('Google account email not verified'), null);
  }
  const user = { id: profile.id, email: emailObj.value, name: profile.displayName };
  done(null, user);
}));

  

// Serialize user info into session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((obj, done) => {
  done(null, obj);
});
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/auth/google/callback` : "/api/auth/google/callback",
            proxy: true
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists
                let user = await User.findOne({ googleId: profile.id });
                if (user) {
                    return done(null, user);
                }

                // If not found by googleId, check by email
                if (profile.emails && profile.emails.length > 0) {
                    user = await User.findOne({ email: profile.emails[0].value });
                    if (user) {
                        // Link google account to existing email
                        user.googleId = profile.id;
                        user.avatar = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : "";
                        await user.save();
                        return done(null, user);
                    }
                }

                // Create new user (note: dailyLimit and remainingScans might not be stored if missing from schema, but included for complete flow)
                user = await User.create({
                    googleId: profile.id,
                    name: profile.displayName || "Google User",
                    email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : undefined,
                    avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : "",
                    plan: "FREE",
                    dailyLimit: 3,
                    remainingScans: 3
                });

                done(null, user);
            } catch (err) {
                console.error(err);
                done(err, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

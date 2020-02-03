const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/users');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const FaceboodTokenStrategy = require('passport-facebook-token');

const config = require('./config');

exports.local = passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = user => {
  return jwt.sign(user, config.secretKey, { expiresIn: 3600 });
};

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.secretKey
};

exports.jwtPassport = passport.use(
  new JwtStrategy(opts, (jwt_payload, done) => {
    console.log('JWT payload: ', jwt_payload);
    User.findOne({ _id: jwt_payload._id }, (err, user) => {
      if (err) {
        return done(err, false);
      } else if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
  })
);

exports.verifyUser = passport.authenticate('jwt', { session: false });
exports.verifyAdmin = (req, res, next) => {
  if (!req.user.admin) {
    const err = new Error('You are not authorized to perform this operation!');
    res.setHeader('WWW-Authenticate', 'Basic');
    err.status = 403;
    return next(err);
  }
  next();
};

exports.FaceboodTokenStrategy = passport.use(
  new FaceboodTokenStrategy(
    {
      clientID: config.facebook.clientId,
      clientSecret: config.facebook.clientSecret
    },
    (accessToken, refreshToken, profile, done) => {
      User.findOne({ facebookId: profile.id }, (err, user) => {
        if (err) {
          return done(err, false);
        }
        if (!err && user !== null) {
          return done(null, user);
        }

        // If hit this point, means user not found, then we need to create new user
        user = new User({
          username: profile.displayName
        });
        user.facebookId = profile.id;
        user.firstname = profile.name.givenName;
        user.lastname = profile.name.familyName;
        user.save((err, user) => {
          if (err) {
            return done(err, false);
          } else {
            return done(null, user);
          }
        });
      });
    }
  )
);

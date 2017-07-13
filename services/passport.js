const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const User = require('../models/User')


passport.use(new LocalStrategy({ usernameField: 'username' },
  function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err) throw err;
      if(!user) {
        return done(null, false, { message: 'unknown user' });
      }
      user.comparePassword(password, user.password, function(err, isMatch) {
        if (err) throw err;
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Invalid password' });
        }
      });
    });
  }));

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var logger = require(__base + 'configs/logger');

// Passport Staff Model
var User = require(__base + 'models/user')

// expose this function to our app using module.exports
module.exports = function(passport) {
    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use(new BasicStrategy(
      function(username, password, done) {
          logger.info("Attempt to API login user: " + username + " with password: " + password);
          User.findOne({ 'userId' :  username }, function(err, user) {
              // if there are any errors, return the error before anything else
              if (err) return done(err);

              // if no user is found, return the message
              if (!user)
                  return done(null, false);

              // if the user is found but the password is wrong
              if (!user.validPassword(password))
                  return done(null, false);

              // all is well, return successful user
              return done(null, user);
          });
      }
    ));

    // local login
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password
        usernameField : 'userId',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, userId, password, done) { // callback with username and password from our form
        logger.info("Attempt to login user: " + userId + " with password: " + password);
        User.findOne({ 'userId' :  userId }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err) return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'Incorrect userId.'));

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Incorrect password.'));

            // all is well, return successful user
            return done(null, user);
        });

    }));

    // local sign up
    passport.use('local-signup', new LocalStrategy({
        usernameField : 'userId',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    }, function(req, userId, password, callback) {
        process.nextTick(function() {
            User.findOne({'userId' : userId }, function(err, user) {
                if (err)  return callback(err);
                if (user) return callback(null, { Error: 'User already exists' });

                // if there is no user with that username create the staff member
                var newUser = new User();

                // set the user's local credentials
                newUser.userId = userId;
                newUser.role = req.body.role;
                newUser.userName = req.body.userName;
                newUser.password = newUser.generateHash(password);

                // save the user
                newUser.save(function(err) {
                    if (err) return callback(err);
                    return callback(null, { Message: 'User created successfuly' });
                });
            });
        });
    }));

    // local delete
    passport.use('local-delete', new LocalStrategy({
        usernameField : 'userId',
        passwordField : 'userId',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    }, function(req, userId, password, callback) {
        process.nextTick(function() {
            User.findOne({ 'userId':userId }, function(err, user) {
                // if there are any errors, return the error before anything else
                if (err) return callback(err);

                // if no user is found, return the message
                if (!user) return callback(null, { Error: 'User not found' });

                if (user.userId == req.user.userId) return callback(null, { Error: 'Cannot delete yourself' });

                User.remove({ 'userId': userId }, function(err) {
                    if (err) return callback(err);
                    return callback(null, { Message: 'User removed' });
                });
            });
        });
    }));
};

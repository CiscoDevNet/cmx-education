var express = require('express');
var router = express.Router();
var logger = require(__base + 'configs/logger');
var auth = require(__base + 'configs/auth');
var util = require('util');

// Model
var User = require(__base + 'models/user');

// HTTP GET : will return all users
module.exports = function(passport) {
	router.get('/user/info', passport.authenticate('basic', { session : false }), function(req, res, next) {
		logger.info("Find info for user: " + req.user.userId);
		User.findOne({ 'userId' :  req.user.userId }, function(err, user) {
			if (err) return res.json({
				Error: err.message
			});
			user.password = '';
			return res.json(user);
		});
	});

	return router;
};

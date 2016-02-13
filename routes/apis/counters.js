var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var logger = require(__base + 'configs/logger');
var configs = require(__base + 'configs/config')
var auth = require(__base + 'configs/auth');
var redis = require('redis');

var client = redis.createClient();

client.on('connect', function() {
	logger.info('We are connected to Redis!');
});

// Model
var User = require(__base + 'models/user');
var Device = require(__base + 'models/device');

// HTTP GET : will return the app settings
router.get('/counters/all', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {
	logger.info("Attempting to get all counters for: " + req.user.userId);
	if (req.user.role === "admin") {
		User.find({
			role: "student"
		}).count(function(err, count) {
			if (err) return res.json({
				Error: err.message
			});
			logger.info("Counter for users is: " + count);
			var counters = {};
			counters.totalStudentUsers = count;
			Device.find().count(function(err, count) {
				if (err) return res.json({
					Error: err.message
				});
				logger.info("Counter for devices is: " + count);
				counters.totalDevices = count;
				client.keys("*", function(err, keys) {
					if (err) return res.json({
						Error: err.message
					});
					logger.info("Number of client keys: " + keys.length);
					counters.totalClients = keys.length;
					return res.json(counters);
				});
			});
		});
	} else {
		var counters = {};
		Device.find({
			userId: req.user.userId
		}).count(function(err, count) {
			if (err) return res.json({
				Error: err.message
			});
			logger.info("Counter for devices is: " + count);
			counters.totalDevices = count;
			return res.json(counters);
		});
	}
});

module.exports = router;

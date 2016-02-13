var express = require('express');
var router = express.Router();
var request = require('request');
var logger = require(__base + 'configs/logger');
var auth = require(__base + 'configs/auth');
var util = require('util');

// Model
var HelpRequest = require(__base + 'models/helpRequest');
var Settings = require(__base + 'models/setting');

// HTTP GET : will return all users
module.exports = function(passport) {
	router.post('/help/staff', passport.authenticate('basic', { session : false }), function(req, res, next) {
		logger.info("Request for staff help from: " + req.user.userId);
		//var clientIpAddress = req.connection.remoteAddress
		var clientIpAddress = "10.22.243.180"
		logger.info("Request to get location with client IP address: " + clientIpAddress);
		Settings.findOne(function(err, settings) {
			if (settings) {
				var cmxSettings = {}
				cmxSettings.cmxHost = settings.cmxHost;
				cmxSettings.cmxPort = settings.cmxPort;
				cmxSettings.cmxUser = settings.cmxUser;
				cmxSettings.cmxPassword = settings.cmxPassword;
				auth = "Basic " + new Buffer(cmxSettings.cmxUser + ":" + cmxSettings.cmxPassword).toString("base64");
				request({
						rejectUnauthorized: false,
						url: "https://" + cmxSettings.cmxHost + ":" + cmxSettings.cmxPort + "/api/location/v2/clients?ipAddress=" + clientIpAddress,
						headers: {
							"Authorization": auth
						}
					},

					function(error, response, body) {
						logger.info("Body: " + body);
						if (!error && response.statusCode == 200) {
							var jsonData = JSON.parse(body);
							logger.info(JSON.stringify(body, null, 4));
							logger.info("MAC Addresss: " + jsonData[0].macAddress);
							var helpRequest = new HelpRequest();
							helpRequest.userId = req.user.userId;
							helpRequest.macAddress = jsonData[0].macAddress;
							helpRequest.requestType = req.body.requestType;
							helpRequest.requestId = helpRequest.generateId();
							helpRequest.save(function(err) {
								logger.error("Error: " + err);
								if (err) return res.json({
									Error: err.message
								});
								return res.json({
									Message: 'Request Submitted'
								});
							});
						} else if (error) {
							logger.error('Error: ' + error);
						}
					}
				);
			}
		});
	});

	return router;
};

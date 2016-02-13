var express = require('express');
var router = express.Router();
var request = require('request');
var logger = require(__base + 'configs/logger');
var auth = require(__base + 'configs/auth');
var redis = require('redis');
var fs = require('fs');

//global vars
var constants = require(__base + 'constants/constants')
var Settings = require(__base + 'models/setting')


// grab the CMX Settings from db
module.exports = function(passport) {

	router.get('/location/currentClient',  passport.authenticate('basic', { session : false }), function(req, res, next) {
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
						logger.debug("Body: " + body);
						if (!error && response.statusCode == 200) {
							var body = JSON.parse(body);
							logger.debug(JSON.stringify(body, null, 4));
							return res.json(body)
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

var express = require('express');
var router = express.Router();
var request = require('request');
var logger = require(__base + 'configs/logger');
var auth = require(__base + 'configs/auth');
var redis = require('redis');

//global vars
var client = redis.createClient();
var constants = require(__base + 'constants/constants')
var Settings = require(__base + 'models/setting')


// grab the CMX Settings from db

router.get('/maps/', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {
	logger.info("Request to get map information");
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
					url: "https://" + cmxSettings.cmxHost + ":" + cmxSettings.cmxPort + "/api/config/v1/maps",
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
			request({
					rejectUnauthorized: false,
					url: "https://" + cmxSettings.cmxHost + ":" + cmxSettings.cmxPort + "/api/location/v2/clients",
					headers: {
						"Authorization": auth
					}
				},

				function(error, response, body) {
					if (!error && response.statusCode == 200) {
						var jsonResult = JSON.parse(body);
						for (var i = 0; i < jsonResult.length; i++) {
							var clientLocation = {};
							clientLocation.macAddress = jsonResult[i].macAddress;
							clientLocation.mapHierarchyString = jsonResult[i].mapInfo.mapHierarchyString;
							clientLocation.floorRefId = jsonResult[i].mapInfo.floorRefId;
							clientLocation.lastLocatedTime = jsonResult[i].statistics.lastLocatedTime;
							logger.info("Saving REDIS: " + JSON.stringify(clientLocation))
							client.set(clientLocation.macAddress, JSON.stringify(clientLocation), function(err, reply) {
								if (err) console.log(err);
								client.expireat(clientLocation.macAddress, parseInt((+new Date)/1000) + 86400);
							});
						}
					} else if (error) {
						logger.error('Error: ' + error);
					}
				}
			);
		}
	});

});

module.exports = router;

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

	router.get('/map/image/:floorImageName', passport.authenticate('basic', { session : false }), function(req, res, next) {
		logger.info("Request to get map image for image name: " + req.params.floorImageName);
		if (fs.existsSync('./public/downloads/maps/' + req.params.floorImageName)) {
			logger.info("Existing image found for image name: " + req.params.floorImageName);
			res.download('./public/downloads/maps/' + req.params.floorImageName);
			return;
		}
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
						url: "https://" + cmxSettings.cmxHost + ":" + cmxSettings.cmxPort + "/api/config/v1/maps/imagesource/" + req.params.floorImageName,
						headers: {
							"Authorization": auth
						}
					}
				).pipe(fs.createWriteStream('./public/downloads/maps/' + req.params.floorImageName)).on('close', function() {
					res.download('./public/downloads/maps/' + req.params.floorImageName);
				});
			}
		});
	});

	router.get('/map/info',  passport.authenticate('basic', { session : false }), function(req, res, next) {
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
			}
		});
	});
	return router;
};

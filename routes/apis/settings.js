var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var logger = require(__base + 'configs/logger');
var configs = require(__base + 'configs/config')
var auth = require(__base + 'configs/auth');

// Model
var Settings = require(__base + 'models/setting');

// HTTP GET : will return the app settings
// Here's an example of the call: http://localhost:3000/api/v1/settings
/*
	[
		{
			_id: "55ba8fad36c7b90000000001",
			twilioToken: "sdfsdfsdfxzzxczxcxzczxcxzc",
			twilioSid: "111",
			twilioPhone: "555",
			__v: 0,
			date: "2015-07-30T20:57:17.662Z"
		}
	]
*/

router.get('/settings', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {
  Settings.findOne(function(err, settings) {
    if (err) return res.json({Error: err.message});
    if (!settings) return res.json({ Error: "No saved settings" });

    return res.json(settings);
  });
});

// HTTP POST : will create or update a settings file
// Here's an example of the call: POST http://localhost:3000/api/v1/settings
/*

{
  "Message": "Settings done"
}
*/

router.post('/settings', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {

  Settings.findOne(function(err, settings) {
  	if (err) return res.json({Error: err.message});
  	if (!settings) var settings = new Settings();
	settings.twilioPhone = req.body.twilioPhone;
	settings.twilioSid = req.body.twilioSid;
	settings.twilioToken = req.body.twilioToken;

	settings.save(function(err) {
		if (err) return res.json({ Error: err.message });
		return res.json({ Message: 'Settings updated' });
	});
  });
});


router.post('/settings/cmx', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {
    logger.info("CMX: " + req.body.cmxHost);
  	Settings.findOne(function(err, settings) {
        if (err) return res.json({Error: err.message});
        if (!settings) var settings = new Settings();
        settings.cmxHost = req.body.cmxHost;
        settings.cmxPort = req.body.cmxPort;
        settings.cmxUser = req.body.cmxUser;
        settings.cmxPassword = req.body.cmxPassword;

		//settings.cmxDeveloperKey = crypto.randomBytes(32).toString('hex');
		settings.save(function(err) {
			if (err) return res.json({ Error: err.message });
			return res.json({ Message: settings.cmxHost });
		});
	});
});

router.get('/configs', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {
	return res.json(configs)
});

module.exports = router;

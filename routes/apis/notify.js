var express = require('express');
var twilio = require('twilio');
var router = express.Router();
var request = require('request');
var logger = require(__base + 'configs/logger');
var auth = require(__base + 'configs/auth');
var constants = require(__base + 'constants/constants')

// Model
var Device = require(__base + 'models/device')
var Settings = require(__base + 'models/setting')

var twilioNotify = function(phoneNumber, message) {

	Settings.findOne(function(err, settings) {
		var twilioSettings = {}
		var twilioClient;
		twilioSettings.twilioPhone = {};
		twilioSettings.twilioSid = {};
		twilioSettings.twilioToken = {};

		if (settings) {
			twilioSettings.twilioPhone = settings.twilioPhone;
			twilioSettings.twilioSid = settings.twilioSid;
			twilioSettings.twilioToken = settings.twilioToken;

			if (twilioSettings.twilioSid && twilioSettings.twilioToken) {
				twilioClient = new twilio.RestClient(twilioSettings.twilioSid, twilioSettings.twilioToken);
			}
			twilioClient.sms.messages.create({
			    to: phoneNumber,
			    from: twilioSettings.twilioPhone,
			    body: message
			}, function(error, message) {
			    // The HTTP request to Twilio will run asynchronously. This callback
			    // function will be called when a response is received from Twilio
			    // The "error" variable will contain error information, if any.
			    // If the request was successful, this value will be "falsy"
			    if (!error) {
			        // The second argument to the callback will contain the information
			        // sent back by Twilio for the request. In this case, it is the
			        // information about the text messsage you just sent:

			        logger.info('Success! The SID for this SMS message is:');
			        logger.info(message.sid);

			        logger.info('Message sent on:');
			        logger.info(message.dateCreated);

			        // increment the SMS counter by calling our own API
			        request.post("http://localhost:3000/api/v1/graphs");

			    } else {
			        logger.info("Error: " + error.message);
			    }
			});
		}
	});
}

// HTTP POST : This will broadcast to all registered devices in the system. It
// has no understanding of limits, everyone will get notfified. Here's an example
// of the call: POST http://localhost:3000/api/v1/notify/all
/*

	{
		notificationMessage: "This is an emergency message"
	}

You will get the following response. We are dependent on Twilio's SMS service in the
cloud and we are triggering this async, so good or bad the following response will
be returned, unless an error is thrown before hand.

	{
	  "Message": "Processing messages!"
	}

*/

router.post('/notify/users/', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {

	var notificationMessage = req.body.notificationMessage;
	if (notificationMessage == null) res.json({Error: "Provide a notification message"});

	Device.find(function(err, devices) {
      if (err) return res.json({Error: err.message});
      if (devices.length == 0) return res.json({ Error: "No registered devices found in the system, unable to notify!" });

		logger.info("Number of Devices: " + devices.length);
		for (var attribute in devices) {
			logger.info("Sending message to: " + devices[attribute].phoneNumber);
    		twilioNotify(devices[attribute].phoneNumber, notificationMessage);
		}
  	});

    return res.json({ Message: "Processing messages" });
});

// HTTP POST : will notify a single user in the system. You will need
// to provide the unique ID for that particular user in your POST request payload
// Here's an example: POST http://localhost:3000/api/v1/notify/user/id
/*
	{
		registeredId: 55a692f5221c71c3f2000001,
		notificationMessage: "This is an emergency message"
	}

You will get the following response. We are dependent on Twilio's SMS service in the
cloud and we are triggering this async, so good or bad the following response will
be returned, unless an error is thrown before hand.

	{
	  "Message": "Processing messages!"
	}

*/

router.post('/notify/user/id', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {

	var registeredId = req.body.registeredId
	var notificationMessage = req.body.notificationMessage;

	if (registeredId == null) return res.json({Error: "Provide a registered user object id"})
	if (notificationMessage == null) return res.json({Error: "Provide a notification message"})

	Device.findById(registeredId, function(err, device) {
		if (err) res.json({Error: err.message});
		if (!device) return res.json({ Error: "No user found" });

        twilioNotify(device.phoneNumber, notificationMessage);
    });

    return res.json({ Message: "Processing message" });
});

// HTTP POST : will notify a subset of devices in the system. In your payload
// send an array of unique ID's for each of the registered devices. For example
// to send notifications to the following two registered devices you will need to
// send the following payload : POST http://localhost:3000/api/v1/notify/devices/id
/*

{
  "registeredIds": [
    "55aae3fdc6ac37de82000001", "55a6b193ff6bad1c2f000001"
  ],

  "notificationMessage":  "This is an emergency message"

}

You will get the following response. We are dependent on Twilio's SMS service in the
cloud and we are triggering this async, so good or bad the following response will
be returned, unless an error is thrown before hand.

	{
	  "Message": "Processing messages!"
	}

*/

router.post('/notify/users/id', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {

	var registeredIds = req.body.registeredIds
	var notificationMessage = req.body.notificationMessage;

	if (registeredIds == null) return res.json({Error: "Provide registered user object ids"})
	if (notificationMessage == null) return res.json({Error: "Provide a notification message"})

	Device.find({ '_id': { $in: registeredIds } }, function(err, devices) {
		if (err) return res.json({ Error: err.message })
		if (devices.length == 0) return res.json({ Error: "No registered devices found in the system, unable to notify!" });

  	 	logger.info("Number of Devices: " + devices.length);

  	 	for (var attribute in devices) {
			twilioNotify(devices[attribute].phoneNumber, notificationMessage);
		}

	});

	return res.json({ Message: "Processing messages" });
});

// HTTP POST : will notify a subset of devices in the system. In your payload
// send an array of unique mac-addresses for each of the registered devices. For example
// to send notifications to the following two registered devices you will need to
// send the following payload. POST http://localhost:3000/api/v1/notify/devices/mac

/*

{
  "registeredMacs": [
    "3c:a9:f4:33:ab:80", "7c:d1:c3:d8:8d:fb"
  ],
  "notificationMessage":  "This is an emergency message"
}

You will get the following response. We are dependent on Twilio's SMS service in the
cloud and we are triggering this async, so good or bad the following response will
be returned, unless an error is thrown before hand.

	{
	  "Message": "Processing messages!"
	}

*/

router.post('/notify/users/mac', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {

	var registeredMacs = req.body.registeredMacs;
	var notificationMessage = req.body.notificationMessage;

	if (registeredMacs == null) return res.json({Error: "Provide registered mac ids"})
	if (notificationMessage == null) return res.json({Error: "Provide a notification message"})

	Device.find({ 'macAddress': { $in: registeredMacs } }, function(err, devices) {
		if (err) return res.json({ Error: err.message })
		if (devices.length == 0) return res.json({ Error: "No registered devices found in the system, unable to notify" });

  	 	logger.info("Number of Devices: " + devices.length);

  	 	for (var attribute in devices) {
			twilioNotify(devices[attribute].phoneNumber, notificationMessage);
		}

	});

	return res.json({ Message: "Processing messages" });
});


module.exports = router;

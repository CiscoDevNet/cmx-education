var express = require('express');
var router = express.Router();
var request = require('request');
var logger = require(__base + 'configs/logger');
var auth = require(__base + 'configs/auth');
var twilio = require('twilio');


// Model
var Device = require(__base + 'models/device')
var PendingDevice = require(__base + 'models/pendingDevice')
var User = require(__base + 'models/user');
var Settings = require(__base + 'models/setting')


var twilioSettings = {}
var twilioClient;
twilioSettings.twilioPhone = {};
twilioSettings.twilioSid = {};
twilioSettings.twilioToken = {};

// grab the Twilio Settings from db
Settings.findOne(function(err, settings) {

	if (settings) {
		twilioSettings.twilioPhone = settings.twilioPhone;
		twilioSettings.twilioSid = settings.twilioSid;
		twilioSettings.twilioToken = settings.twilioToken;

		if (twilioSettings.twilioSid && twilioSettings.twilioToken) {
			twilioClient = new twilio.RestClient(twilioSettings.twilioSid, twilioSettings.twilioToken);
		}
	}

});

var twilioNotify = function(phoneNumber, message) {

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

// HTTP GET : will return all registered users in the system.
// Here's an example of the call: http://localhost:3000/api/v1/register

/*
	[
		{
			_id: "55a692f5221c71c3f2000001",
			phoneNumber: "+14085440644",
			macAddress: "11:34:43:23:00:00",
			__v: 0,
			date: "2015-07-15T17:05:57.188Z"
		},
		{
			_id: "55a6b193ff6bad1c2f000001",
			phoneNumber: "+14085478644",
			macAddress: "11:34:45:23:00:00",
			__v: 0,
			date: "2015-07-15T19:16:35.731Z"
		}
	]
*/

router.get('/register', auth.isLoggedIn, function(req, res, next) {
	if (req.user.role === "admin") {
		Device.find(function(err, devices) {
			if (err) return res.json({
				Error: err.message
			});
			return res.json(devices);
		});
	} else {
		Device.find({
			userId: req.user.userId
		}, function(err, devices) {
			if (err) return res.json({
				Error: err.message
			});
			return res.json(devices);
		});

	}
});


router.get('/pendingDevice', auth.isLoggedIn, function(req, res, next) {
	PendingDevice.findOne({
		userId: req.user.userId
	}, function(err, device) {
		if (err) return res.json({
			Error: err.message
		});
		if (!device) return res.json({
			Error: "No registered devices found in the system"
		});

		return res.json(device);
	});
});

// HTTP POST : will create a new user in the system.
// Here's an example of the call: POST against http://localhost:3000/api/v1/register/
// In your payload you will need to send both the macAddress and phoneNumber
/*

	{
		phoneNumber: "+14085440644",
		macAddress: "00:32:AB:CC:DD:EE"
	}

You will get the following response if the user was created successfully

	{
	  "Message": "User registered!"
	}

*/

router.post('/register/add', auth.isLoggedIn, function(req, res, next) {
	logger.info("Register new device: " + req.body.macAddress);

	if (req.user.role === "admin") {
		var device = new Device();
		device.macAddress = req.body.macAddress;
		device.phoneNumber = req.body.phoneNumber;
		device.userId = req.body.userId;
		User.find({
			userId: req.body.userId
		}, function(err, userids) {
			if (err) return res.json({
				Error: err.message
			});
			if (userids.length == 0) return res.json({
				Error: "User id does not exist"
			});

			device.save(function(err) {
				if (err) return res.json({
					Error: err.message
				});
				return res.json({
					Message: 'Device registered'
				});
			});
		});

	} else {
		PendingDevice.remove({
			userId: req.user.userId
		}, function(err, device) {
			var pendingDevice = new PendingDevice();
			pendingDevice.macAddress = req.body.macAddress;
			pendingDevice.phoneNumber = req.body.phoneNumber;
			pendingDevice.userId = req.user.userId;
			pendingDevice.confirmationCode = Math.floor(Math.random() * (99999 - 10000) + 10000);
		pendingDevice.save(function(err) {
			if (err) return res.json({
				Error: err.message
			});
			twilioNotify(pendingDevice.phoneNumber, "Please use confirmation code " + pendingDevice.confirmationCode);
			return res.json({
				Message: 'Device registered'
			});
		});
	});
	}
});

router.post('/register/confirm', auth.isLoggedIn, function(req, res, next) {
	logger.info("Confirm for MAC: " + req.body.macAddress);
	PendingDevice.findOne({
		userId: req.user.userId,
		macAddress: req.body.macAddress
	}, function(err, device) {
		if (err) return res.json({
			Error: err.message
		});
		if (!device) return res.json({
			Error: "No pending registered devices found in the system"
		});
		if (req.body.confirmCode !== device.confirmationCode) {
			return res.json({
				Error: "Confirmation code does not match"
			});
		}
		var saveDevice = new Device();
		saveDevice.macAddress = device.macAddress;
		saveDevice.phoneNumber = device.phoneNumber;
		saveDevice.userId = device.userId;
		saveDevice.save(function(err) {
			if (err) return res.json({
				Error: err.message
			});
			PendingDevice.remove({
				userId: req.user.userId
			}, function(err, device) {
			return res.json({
				Message: 'Device registered'
			});
		});
		});
	});
});

// HTTP DELETE : will delete a registered user in the system.
// Here's an example of the call: DELETE http://localhost:3000/api/v1/register/id/55a692f5221c71c3f2000001
/*

You will get the following response if the user was deleted successfully

	{
	  "Message": "User deleted!"
	}
*/

router.post('/register/delete', auth.isLoggedIn, function(req, res, next) {
	logger.info("Request to delete a registered deivce");
	logger.info("Delete: " + req.body);
	var deviceMacAddress = req.body.macAddress;
	var devicePhoneNumber = req.body.phoneNumber;
	var deviceUserId = req.user.userId;
	if (req.user.role === "admin") {
		deviceUserId = req.body.userId
	}

	Device.remove({
		macAddress: deviceMacAddress,
		phoneNumber: devicePhoneNumber,
		userId: deviceUserId
	}, function(err, device) {
		if (err) return res.json({
			Error: err.message
		});
		if (!device) return res.json({
			Error: "Unable to find a device"
		});

		return res.json({
			Message: 'Device deleted'
		});
	});
});

module.exports = router;

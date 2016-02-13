var express = require('express');
var redis = require('redis');
var async = require('async');
var _ = require("underscore");
var router = express.Router();
var logger = require(__base + 'configs/logger');
var auth = require(__base + 'configs/auth');

// Model
var Device = require(__base + 'models/device')

var client = redis.createClient();

var constants = require(__base + 'constants/constants')

client.on('connect', function() {
	logger.info('We are connected to Redis!');
});

filter = function(collection, key, regex) {
	return _.filter(collection, function(obj) {
		return obj[key].match(regex);
	});
};

// HTTP GET : will return a notification from Redis based on a unique mac-address
// Here's an example of the call: http://localhost:3000/api/v1/notifications/mac/80:e6:50:16:28:14
/*

{
	notifications: [
		{
			notificationType: "movement",
			subscriptionName: "David Test",
			entity: "WIRELESS_CLIENTS",
			deviceId: "80:e6:50:16:28:14",
			lastSeen: "2015-07-17T12:18:31.047-0700",
			locationMapHierarchy: "System Campus>SJC-14>1st Floor>Coverage",
			locationCoordinate: {
				x: 212.61044,
				y: 69.71867,
				z: 0,
				unit: "FEET"
			},
			confidenceFactor: 88,
			apMacAddress: null,
			ssid: null,
			band: null,
			floorId: 730297895206534100,
			moveDistanceInFt: 51.345875,
			timestamp: 1437160711047
		}
	]
}

*/

router.get('/notifications/mac/:mac_address', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {
	logger.info(req.params.mac_address);

	var macAddress = req.params.mac_address;
	if (macAddress == null) res.json({
		Error: "Provide a mac address"
	})

	Device.findOne({
		macAddress: req.params.mac_address
	}, function(err, device) {
		if (err) return res.json({
			Message: err.message
		});
		if (!device) return res.json({
			Error: "No devices found"
		});

		// -1, -1 is the last item pushed into the list, in our case, the latest moved location
		client.lrange(req.params.mac_address, -1, -1, function(err, reply) {
			if (reply.length == 0 || reply == null || reply == undefined) return res.json([])
			data = JSON.parse(reply);
			logger.info(data);
			return res.json(data)

		});

	});
});

// HTTP GET : will return all known notifications from REDIS in regards to our users. This will ONLY
// return notifications that we care about. What do we mean by that you ask? Well we first scan our
// saved set of users, using their mac addresses we query REDIS for their latest data.
// Here's an example of the call: http://localhost:3000/api/v1/notifications
/*
[
	{
		notificationType: "movement",
		subscriptionName: "David Test",
		entity: "WIRELESS_CLIENTS",
		deviceId: "3c:a9:f4:33:ab:80",
		lastSeen: "2015-07-17T12:17:14.457-0700",
		locationMapHierarchy: "System Campus>SJC-21>1st Floor",
		locationCoordinate: {
			x: 119.898674,
			y: 10.669677,
			z: 0,
			unit: "FEET"
		},
		confidenceFactor: 152,
		apMacAddress: null,
		ssid: null,
		band: null,
		floorId: 730297895206534100,
		moveDistanceInFt: 10000,
		timestamp: 1437160634457
	},
	{
		notificationType: "movement",
		subscriptionName: "David Test",
		entity: "WIRELESS_CLIENTS",
		deviceId: "7c:d1:c3:d8:8d:fb",
		lastSeen: "2015-07-17T12:16:01.652-0700",
		locationMapHierarchy: "System Campus>SJC-14>1st Floor",
		locationCoordinate: {
			x: 206,
			y: 0,
			z: 0,
			unit: "FEET"
		},
		confidenceFactor: 80,
		apMacAddress: null,
		ssid: null,
		band: null,
		floorId: 730297895206534100,
		moveDistanceInFt: 42.650887,
		timestamp: 1437160561652
	}
]

*/

router.get('/notifications/', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {

	var calls = [];
	var response = res;
	var finalJsonArray = [];

	Device.find(function(err, devices) {
		if (err) return res.json({
			Message: err.message
		});
		if (devices.length == 0) return res.json({
			Error: "No registered devices found in the system"
		});

		// get each of the mac addresses for our registered users
		devices.forEach(function(device) {
			calls.push(function(callback) {
				logger.info("Searching for: " + device.macAddress)
				client.get(device.macAddress, function(err, reply) {
					logger.info("Found: " + device.macAddress + " Object: " + reply)
					if (err) return callback(err);
					// call the callback
					if (reply == null || reply == undefined) {
						// tag the callback with a location that was not found
						callback(null, {
							mapHierarchyString: 'none'
						});
						return
					} else {
						var data = JSON.parse(reply)
						callback(null, data);
					}
				});
			});
		});

		async.parallel(calls, function(err, reply) {
			/* this code will run after all calls finished the job or
	        when any of the calls passes an error */
			if (err) res.json({
				Message: err.message
			});
			logger.info(JSON.stringify(reply))

			for (var i = 0; i < reply.length; i++) {
				var result = filter(reply[i], 'mapHierarchyString', "none")
				if (result.length == 0) {
					finalJsonArray.push(reply[i])
				}
			}
			return res.json(finalJsonArray)
		});

	});
});

// HTTP GET : will return all known notifications from REDIS based on the map hierarchy
// This is all for the users that we have already registered in our system
// Here's an example of the call: http://localhost:3000/api/v1/notifications/map/System%20Campus%3ESJC-21%3E1st%20Floor
/*

[
	{
		notificationType: "movement",
		subscriptionName: "David Test",
		entity: "WIRELESS_CLIENTS",
		deviceId: "3c:a9:f4:33:ab:80",
		lastSeen: "2015-07-17T12:17:14.457-0700",
		locationMapHierarchy: "System Campus>SJC-21>1st Floor",
		locationCoordinate: {
			x: 119.898674,
			y: 10.669677,
			z: 0,
			unit: "FEET"
		},
		confidenceFactor: 152,
		apMacAddress: null,
		ssid: null,
		band: null,
		floorId: 730297895206534100,
		moveDistanceInFt: 10000,
		timestamp: 1437160634457
	}
]
*/

router.get('/notifications/map/:map_hierarchy', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {

	var calls = [];
	var response = res;
	var finalJsonArray = {};
	finalJsonArray.devices = [];
	finalJsonArray.zones = [];
	var map_hierarchy = req.params.map_hierarchy;
	var mapSelectedArray = map_hierarchy.split('>');
	var mapSelectedDepth = mapSelectedArray.length;

	if (map_hierarchy == null) res.json({
		Error: "Provide a map hierarchy"
	})

	Device.find(function(err, devices) {
		if (err) return res.json({
			Message: err.message
		});
		if (devices.length == 0) return res.json({
			Error: "No registered devices found in the system"
		});

		// get each of the mac addresses for our registered users
		devices.forEach(function(device) {
			calls.push(function(callback) {
				client.get(device.macAddress, function(err, reply) {
					logger.info("Found: " + device.macAddress + " Object: " + reply)
					if (err) return callback(err);
					// call the callback
					if (reply == null || reply == undefined) {
						// tag the callback with a location that was not found
						callback(null, {
							mapHierarchyString: 'none'
						});
						return
					} else {
						var data = JSON.parse(reply)
						data.userId = device.userId;
						callback(null, data);
					}
				});
			});
		});

		async.parallel(calls, function(err, reply) {

			if (err) return res.json({
				Error: err.message
			});

			// some map hierarchies come in this format, which is Campus>Building>Floor
			// at this point we are ok with the above format since it doesn't include the zone
			// sometimes the notification contains the following Campus>Building>Floor>Zone
			// we need to exclude the zone for now!

			logger.info("Map selected depth: " + mapSelectedDepth);
			for (var i = 0; i < reply.length; i++) {
				if (map_hierarchy === "All Campuses") {
					logger.info("Result: " + reply[i].mapHierarchyString)
					finalJsonArray.devices.push(reply[i])
				} else {
					var mapHierarchyArray = reply[i].mapHierarchyString.split('>');
					var zoneArray = [];
					while (mapHierarchyArray.length > mapSelectedDepth) {
						zoneArray.push(mapHierarchyArray.pop())
					}
					var cleanedMapHierarchyString = mapHierarchyArray.join('>');
					var zoneString = zoneArray.join('>');

					logger.info("Original Map: " + reply[i].mapHierarchyString);
					logger.info("Stripped Map: " + cleanedMapHierarchyString);
					logger.info("Selected Map: " + map_hierarchy);
					logger.info("Zone for Map: " + zoneString);
					if (mapSelectedDepth > 2 && zoneString) {
						if (typeof finalJsonArray.zones[zoneString] === 'undefined') {
							finalJsonArray.zones.push(zoneString)
						}
					}
					if (map_hierarchy === cleanedMapHierarchyString) {
						logger.info("Result: " + reply[i].mapHierarchyString)
						finalJsonArray.devices.push(reply[i]);
					}
				}
			}

			logger.info(finalJsonArray)
			return response.json(finalJsonArray);
		});
	});
});

router.get('/notifications/devices/:map_hierarchy', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {

	var calls = [];
	var response = res;
	var finalJsonArray = [];
	var map_hierarchy = req.params.map_hierarchy;
	var mapSelectedArray = map_hierarchy.split('>');
	var mapSelectedDepth = mapSelectedArray.length;

	if (map_hierarchy == null) res.json({
		Error: "Provide a map hierarchy"
	})

	Device.find(function(err, devices) {
		if (err) return res.json({
			Message: err.message
		});
		if (devices.length == 0) return res.json({
			Error: "No registered devices found in the system"
		});

		// get each of the mac addresses for our registered users
		devices.forEach(function(device) {
			calls.push(function(callback) {
				client.get(device.macAddress, function(err, reply) {
					logger.info("Found: " + device.macAddress + " Object: " + reply)
					if (err) return callback(err);
					// call the callback
					if (reply == null || reply == undefined) {
						// tag the callback with a location that was not found
						callback(null, {
							mapHierarchyString: 'none'
						});
						return
					} else {
						var data = JSON.parse(reply)
						data.userId = device.userId;
						callback(null, data);
					}
				});
			});
		});

		async.parallel(calls, function(err, reply) {

			if (err) return res.json({
				Error: err.message
			});

			// some map hierarchies come in this format, which is Campus>Building>Floor
			// at this point we are ok with the above format since it doesn't include the zone
			// sometimes the notification contains the following Campus>Building>Floor>Zone
			// we need to exclude the zone for now!

			logger.info("Parsing map")
			for (var i = 0; i < reply.length; i++) {
				if (map_hierarchy === "All Campuses") {
					logger.info("Result: " + reply[i].mapHierarchyString)
					finalJsonArray.push(reply[i])
				} else {
					var mapHierarchyArray = reply[i].mapHierarchyString.split('>');
					var zoneArray = [];
					while (mapHierarchyArray.length > mapSelectedDepth) {
						zoneArray.push(mapHierarchyArray.pop())
					}
					var cleanedMapHierarchyString = mapHierarchyArray.join('>');
					var zoneString = zoneArray.join('>');

					logger.info("Original Map: " + reply[i].mapHierarchyString);
					logger.info("Stripped Map: " + cleanedMapHierarchyString);
					logger.info("Selected Map: " + map_hierarchy);
					logger.info("Zone for Map: " + zoneString);
					if (map_hierarchy === cleanedMapHierarchyString) {
						logger.info("Result: " + reply[i].mapHierarchyString)
						finalJsonArray.push(reply[i])
					}
				}
			}

			logger.info(finalJsonArray)
			return response.json(finalJsonArray);
		});
	});
});


module.exports = router;

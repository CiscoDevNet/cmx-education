var express = require('express');
var router = express.Router();
var auth = require(__base + 'configs/auth');

// Model
var Graph = require(__base + 'models/graph');

var getCurrentMonthYear = function() {

	var monthNames = ["January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"
	];

	var date = new Date();
	var currentMonth = monthNames[date.getMonth()];
	var currentYear = date.getFullYear();
	var dateString = currentMonth + ', ' + currentYear;

	return dateString;
}

router.get('/graphs', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {
	Graph.find(function(err, data) {
		if (err) return res.json({
			Error: err.message
		});
		if (data.length == 0) return res.json({
			Error: "No graph data found"
		});

		return res.json(data);
	});
});

router.post('/graphs', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {
	Graph.findOne({
		date: getCurrentMonthYear()
	}, function(err, data) {
		if (err) return res.json({
			Error: err.message
		});
		if (!data) var data = new Graph();

		data.date = getCurrentMonthYear();
		data.smsMessages++;

		data.save(function(err) {
			if (err) return res.json({
				Error: err.message
			});
			return res.json({
				Message: 'Graph data updated'
			});
		});
	});
});

module.exports = router;

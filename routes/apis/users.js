var express = require('express');
var router = express.Router();
var auth = require(__base + 'configs/auth');

// Model
var User = require(__base + 'models/user');

// HTTP GET : will return all users

router.get('/users', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {
	User.find(function(err, users) {
		if (err) return res.json({
			Error: err.message
		});
		return res.json(users);
	});
});

module.exports = router;

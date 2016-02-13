var express = require('express');
var router = express.Router();
var logger = require(__base + 'configs/logger');
var auth = require(__base + 'configs/auth');

module.exports = function(passport) {

	// GET login page //
	router.get('/login', function(req, res, next) {
		res.render('login', {
			title: 'Login',
			layout: 'login-layout'
		});
	});

	// POST login page //
	router.post('/login', passport.authenticate('local-login', {
		successRedirect: '/',
		failureRedirect: '/login',
		failureFlash: true
	}));

	// GET home page //
	router.get('/', auth.isLoggedIn, function(req, res, next) {
		logger.info("Loading the default page");
		var locals = getDefaultViewLocals(req);
		locals.title = 'Home';
		locals.menuid = 'menu_index';
		if (req.user.role === "admin") {
			res.render('index-admin', locals);
		} else {
			res.render('index-student', locals);
		}
	});

	// GET help page //
	router.get('/help', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {
		var locals = getDefaultViewLocals(req);
		locals.title = 'Help';
		locals.menuid = 'menu_help';
		res.render('help', locals);
	});

	// GET graphs page //
	router.get('/graphs', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {
		var locals = getDefaultViewLocals(req);
		locals.title = 'Graphs';
		locals.menuid = 'menu_graphs';
		res.render('graphs', locals);
	});

	// GET register an end user page //
	router.get('/register', auth.isLoggedIn, function(req, res, next) {
		var locals = getDefaultViewLocals(req);
		locals.title = 'Device Registration';
		locals.menuid = 'menu_register';
		if (req.user.role === "admin") {
			res.render('register-admin', locals);
		} else {
			res.render('register-student', locals);
		}
	});

	// GET notifications page //
	router.get('/notifications', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {
		var locals = getDefaultViewLocals(req);
		locals.title = 'Notifications';
		locals.menuid = 'menu_notifications';
		res.render('notifications', locals);
	});

	// GET settings page //
	router.get('/settings', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {
		var locals = getDefaultViewLocals(req);
		locals.title = 'Settings';
		locals.menuid = 'menu_settings';
		res.render('settings', locals);
	});

	// GET create admin account page //
	router.get('/users', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {
		var locals = getDefaultViewLocals(req);
		locals.title = 'User Configuration';
		locals.menuid = 'menu_users';
		res.render('users', locals);
	});

	// POST delete a portal user //
	router.post('/user/delete', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {
		passport.authenticate('local-delete', function(err, message) {
			if (err) return res.json({
				Error: err.message
			});
			return res.json(message)
		})(req, res, next);
	});

	// POST admin account page //
	router.post('/user/create', auth.isLoggedIn, auth.isAdmin, function(req, res, next) {
		logger.info("Attempting to create new user: " + req.body.userId);
		passport.authenticate('local-signup', function(err, message) {
			if (err) return res.json({
				Error: err.message
			});
			return res.json(message)
		})(req, res, next);
	});

	// GET logout page //
	router.get('/logout', function(req, res) {
		req.logout();
		req.session.destroy(function(err) {
			res.redirect('/login');
		});
	});

	return router;
};

function getUserImage(req) {
	// if user is an admin, carry on
	if (req.user.role === "admin")
		return "img/user_admin.png";

	// if they aren't redirect them to the home page
	return "img/user_student.png";
}

function getDefaultViewLocals(req) {
	var locals = {
		userid: req.user.userId,
		userrole: req.user.role,
		userimage: getUserImage(req),
	};
	if (req.user.role === "admin") {
		locals.whichMenuPartial = getAdminMenuPartial;
	} else {
		locals.whichMenuPartial = getStudentMenuPartial;
	}
	return locals;
}

function getAdminMenuPartial() {
	return "adminMenuPartial";
}

function getStudentMenuPartial() {
	return "studentMenuPartial";
}

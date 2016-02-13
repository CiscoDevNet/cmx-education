// helper for global base directory
global.__base = __dirname + '/';

// external required modules
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var querystring = require('querystring');
var fs = require('fs');
var http = require('http');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var flash = require('connect-flash');
var redisStore = require('connect-redis')(session);
var logger = require('./configs/logger');
var User = require(__base + 'models/user');

// internal required modules
var configs = require(__dirname + '/configs/config');

// pass passport for configuration
require(__dirname + '/configs/passport')(passport);

// connection to MongoDB
mongoose.connect(configs.mongo_url);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(callback) {
	logger.info("We are connected to Mongo!");
	User.findOne({
		'userId': 'admin'
	}, function(err, user) {
		if (err) return;
		if (user) return;

		// if there is no user with that username create the staff member
		var newUser = new User();

		// set the user's local credentials
		newUser.userId = 'admin';
		newUser.role = 'admin';
		newUser.userName = 'Admin User';
		newUser.password = newUser.generateHash('admin');

		// save the user
		newUser.save(function(err) {
			if (err) return;
		});
	});
});

// View Routes, protected by passport
var viewRoutes = require('./routes/views/routes')(passport);

// API routes
var registerRoute = require('./routes/apis/register');
var notifyRoute = require('./routes/apis/notify');
var mapsRoute = require('./routes/apis/maps');
var notificationsRoute = require('./routes/apis/notifications');
var usersRoute = require('./routes/apis/users');
var settingsRoute = require('./routes/apis/settings');
var graphsRoute = require('./routes/apis/graphs');
var countersRoute = require('./routes/apis/counters');

var userApiRoute = require('./routes/public/apis/user')(passport);
var mapsApiRoute = require('./routes/public/apis/maps')(passport);
var locationApiRoute = require('./routes/public/apis/location')(passport);
var helpRequestApiRoute = require('./routes/public/apis/helpRequest')(passport);

var app = express();
var hbs = require('hbs');
hbs.registerPartials(path.join(__dirname, 'views/partialViews'));

app.use(session({
	store: new redisStore({
		host: configs.redishost,
		port: configs.redistport
	}),
	secret: 'cmx#100topnoTchData'
}));

// required for passport
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// so we can have access to bower_compnents from our code
app.use('/bower_components', express.static(__dirname + '/bower_components'));

// View related routes
app.use('/', viewRoutes);

// API related routes
app.use('/api/v1/', registerRoute);
app.use('/api/v1/', notifyRoute);
app.use('/api/v1/', mapsRoute);
app.use('/api/v1/', notificationsRoute);
app.use('/api/v1/', usersRoute);
app.use('/api/v1/', settingsRoute);
app.use('/api/v1/', graphsRoute);
app.use('/api/v1/', countersRoute);
app.use('/api/v1/', userApiRoute);
app.use('/api/v1/', mapsApiRoute);
app.use('/api/v1/', locationApiRoute);
app.use('/api/v1/', helpRequestApiRoute);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = {};
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err,
			whichMenuPartial: getAdminMenuPartial
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {},
		whichMenuPartial: getAdminMenuPartial
	});
});

function getAdminMenuPartial() {
	return "adminMenuPartial";
}

function getStudentMenuPartial() {
	return "studentMenuPartial";
}

module.exports = app;

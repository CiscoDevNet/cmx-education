
// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated()) {
        return next();
    }

	// if they aren't redirect them to the home page
	res.redirect('/login');
}

// route middleware to make sure a user is an admin
function isAdmin(req, res, next) {

	if (req.user.role === "admin") {
		return next();
	}

	// if they aren't redirect them to the home page
	res.redirect('/');
}

module.exports.isLoggedIn = isLoggedIn;
module.exports.isAdmin = isAdmin;

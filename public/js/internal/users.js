$(window).load(function() {
	// Run code
});

$(function() {
	// Handler for .ready() called. At this point the DOM is ready
	switch (window.location.pathname) {
		case '/users':
			loadUsersTable();
			break;
		default:
	}
});

// Start Dynamic Tables //
var loadUsersTable = function() {
	$('#users-data-table').bootstrapTable({
		pagination: true,
		url: "/api/v1/users",
		search: true,
		showRefresh: true,
		pageSize: 50,
		striped: true,
		formatLoadingMessage: function() {
			return '<span class="glyphicon glyphicon glyphicon-repeat glyphicon-animate"></span>';
		}
	});
};
// End Dynamic Tables //

// create a user button was clicked
$('#create-user-button').click(function() {
    logger.silly("Create user button selected to add new user");

    cmxUtil.clearAllMessages();

	var userId = $("#createUserId").val();
	var userName = $("#createUserName").val();
	var role = $("#userrole").val();
	var password = $("#password").val();
	var retype_password = $("#retype_password").val();

	if (userId === "" || userName === "" || role === "" || password === "" || retype_password === "") {
		logger.error("New User empty fields detected");
		cmxUtil.displayPopupMessage("All form fields are required");
		return;
	}

	if (password != retype_password) {
		logger.error("Password doesn't match");
		cmxUtil.displayPopupMessage("Passwords don't match");
		return;
	}

	logger.debug("Send request to create new user");
	$.post("/user/create/", {
			userId: userId,
			userName: userName,
			password: password,
			role: role
		})
		.done(function(json) {
			if (json.Message) {
                cmxUtil.showSuccessMessage(json.Message);
				$('#users-data-table').bootstrapTable('refresh');
			} else {
                cmxUtil.showErrorMessage(json.Error);
			}
		});
});

$(window).load(function() {
	// Run code
});

$(function() {

	// Handler for .ready() called. At this point the DOM is ready
	switch (window.location.pathname) {
		case '/settings':
			loadSettings();
			break;
		default:
	}
});

var loadSettings = function() {
	$.get("/api/v1/settings")
		.done(function(json) {
			if (!json.Error) {
				$("#twilio-account-phone").val(json.twilioPhone);
				$("#twilio-account-sid").val(json.twilioSid);
				$("#twilio-account-token").val(json.twilioToken);
				$("#cmx-host").val(json.cmxHost);
				$("#cmx-port").val(json.cmxPort);
				$("#cmx-user").val(json.cmxUser);
			} else {
				$('#error-message').html(json.Error);
				$("#error-result").show();
			}
		});
};

// End Dynamic Tables //

// create a portal user ( admin or regular )
$('#cmx-host-button').click(function() {
	logger.silly("Set CMX host button selected to apply CMX settings");
	cmxUtil.clearAllMessages();

	var cmxHost = $("#cmx-host").val();
	var cmxPort = $("#cmx-port").val();
	var cmxUser = $("#cmx-user").val();
	var cmxPassword = $("#cmx-password").val();

	if (cmxHost === "" || cmxPort === "" || cmxUser === "" || cmxPassword === "") {
		logger.error("Empty settings field(s)");
		cmxUtil.displayPopupMessage("Unable to save your settings, all fields are required");
		return;
	}

	logger.debug("Send request to save CMX settings");
	$.post("/api/v1/settings/cmx", {
			cmxHost: cmxHost,
			cmxPort: cmxPort,
			cmxUser: cmxUser,
			cmxPassword: cmxPassword
		})
		.done(function(json) {
			if (json.Message) {
				cmxUtil.showSuccessMessage(json.Message);
			} else {
				cmxUtil.showErrorMessage(json.Error);
			}
		});
});

// settings button
$('#settings-button').click(function() {
	logger.silly("Set Twilio settings button selected to apply Twilio settings");
	cmxUtil.clearAllMessages();

	var twilioPhone = $("#twilio-account-phone").val();
	var twilioSid = $("#twilio-account-sid").val();
	var twilioToken = $("#twilio-account-token").val();

	if (twilioPhone === "" || twilioSid === "" || twilioToken === "") {
		logger.error("Empty settings field(s)");
		cmxUtil.displayPopupMessage("Unable to save your settings, all fields are required");
		return;
	}

	logger.debug("Send request to save Twilio settings");
	$.post("/api/v1/settings", {
			twilioPhone: twilioPhone,
			twilioSid: twilioSid,
			twilioToken: twilioToken
		})
		.done(function(json) {
			if (json.Message) {
				cmxUtil.showSuccessMessage(json.Message);
			} else {
				cmxUtil.showErrorMessage(json.Error);
			}
		});
});

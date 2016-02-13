$(window).load(function() {
	// Run code
});

$(function() {

	// Handler for .ready() called. At this point the DOM is ready
	switch (window.location.pathname) {
		case '/register':
			loadRegisteredDevicesTable();
			loadDevicePending();
			break;
		default:
	}
});

// Start Dynamic Tables //
var loadDevicePending = function() {
	$.get("/api/v1/pendingDevice")
		.done(function(json) {
			if (!json.Error) {
				logger.info("Set confirmation MAC Address: " + json.macAddress);
				$("#confirmMacAddress").html(json.macAddress);
				$("#confirmDeviceDiv").show();
			}
		});
};

var loadRegisteredDevicesTable = function() {
	// registered mongo users
	$('#registered-devices-data-table').bootstrapTable({
		pagination: true,
		url: "/api/v1/register",
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

// create an end user manually through a form
$('#register-device-button').click(function() {
    logger.silly("Register device button selected to add new device");

    cmxUtil.clearAllMessages();

	var macAddress = $("#macAddress").val();
	var phoneNumber = $("#phoneNumber").val();
	var userId = "";

	// make sure it's a valid mac address
	var re = /^(([A-Fa-f0-9]{2}[:]){5}[A-Fa-f0-9]{2}[,]?)+$/;

	if (macAddress === "" || macAddress === null || !re.test(macAddress)) {
		logger.error("MAC address field is empty");
		cmxUtil.displayPopupMessage("Unable to register a user, please provide a valid mac adddress");
		return;
	}

	if (phoneNumber === "" || phoneNumber === null) {
		logger.error("Phone Number is Empty");
		cmxUtil.displayPopupMessage("Unable to register a user, please provide a valid phone number");
		return;
	}

	if ($('#userId').length) {
		userId = $("#userId").val();
		if (userId === "" || userId === null) {
			logger.error("User ID is Empty");
			cmxUtil.displayPopupMessage("Unable to register a user, please provide a valid user ID");
			return;
		}

	}

    logger.debug("Send request to register a new device");
	$.post("/api/v1/register/add", {
			macAddress: macAddress,
			phoneNumber: phoneNumber,
			userId: userId
		})
		.done(function(json) {
			if (json.Message) {
				cmxUtil.showSuccessMessage(json.Message);
				loadDevicePending();
				$('#registered-devices-data-table').bootstrapTable('refresh');
			} else {
				cmxUtil.showErrorMessage(json.Error);
			}
		});
});

// create an end user manually through a form
$('#confirm-device-button').click(function() {
    logger.silly("Confirm device button selected to add new device");

    cmxUtil.clearAllMessages();

	var macAddress = $("#confirmMacAddress").html();
	var confirmCode = $("#confirmCode").val();

	if (macAddress === "" || macAddress === null) {
		logger.error("Confirmation device is empty");
		cmxUtil.displayPopupMessage("Unable to confirm device since no device requires confirmation");
		return;
	}

	if (confirmCode === "" || confirmCode === null) {
		logger.error("Confirmation code is empty");
		cmxUtil.displayPopupMessage("Unable to confirm device, please provide a valid confirmation code");
		return;
	}

    logger.debug("Send request to register a new device");
	$.post("/api/v1/register/confirm", {
			macAddress: macAddress,
			confirmCode: confirmCode
		})
		.done(function(json) {
			if (json.Message) {
				cmxUtil.showSuccessMessage(json.Message);
				$('#registered-devices-data-table').bootstrapTable('refresh');
				$("#confirmDeviceDiv").hide();
			} else {
				cmxUtil.showErrorMessage(json.Error);
			}
		});
});

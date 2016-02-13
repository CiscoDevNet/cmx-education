var selectedMap = null;
var deviceIds = [];
var dropdownClickCounter = 0;

$(window).load(function() {
	// Run code
});

$(function() {
	// Handler for .ready() called. At this point the DOM is ready
	switch (window.location.pathname) {
		case '/notifications':
			loadNotificationsTable();
			break;
		default:
	}
});

// Start Dynamic Tables //
var loadNotificationsTable = function() {
	$('#users-data-table').bootstrapTable({
		pagination: true,
		url: "/api/v1/notifications/devices/" + selectedMap,
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

// send push notifications button clicked
$("#send-notification-button").click(function() {
	logger.silly("Send notifications button selected to send SMS message");

	cmxUtil.clearAllMessages();

	// check to make sure we have twilio account settings in place
	$.get("/api/v1/settings")
		.done(function(json) {
			if (!json.Error) {
				var notificationMessage = $("#notification-message-box").val();
				logger.silly("Notification message being sent: " + notificationMessage);
				if (selectedMap === "" || selectedMap === null) {
					logger.error("There is no map selected for the notification message");
					cmxUtil.displayPopupMessagel("Unable to send notifications, please select a location.");
					return;
				}

				if (notificationMessage === "" || notificationMessage === null) {
					logger.error("Notification message cannot be blank");
					cmxUtil.displayPopupMessage("Unable to send notifications, fill in the notification message.");
					return;
				}

				if (deviceIds.length <= 0 && selectedMap != "All Campuses") {
					logger.error("No devices found in current location");
					cmxUtil.displayPopupMessage("No devices found in current location");
					return;
				}

				if (selectedMap == "All Campuses") {
					logger.debug("Send request to send notification message for all devices on campus");
					$.post("/api/v1/notify/users", {
							notificationMessage: notificationMessage
						})
						.done(function(json) {
							if (json.Message) {
								cmxUtil.showSuccessMessage(json.Message);
							} else {
								cmxUtil.showErrorMessage(json.Error);
							}
						});
				} else {
					logger.debug("Send request to send notification message for selected devices");
					$.post("/api/v1/notify/users/mac", {
							registeredMacs: deviceIds,
							notificationMessage: notificationMessage
						})
						.done(function(json) {
							if (json.Message) {
								cmxUtil.showSuccessMessage(json.Message);
							} else {
								cmxUtil.showErrorMessage(json.Error);
							}
						});
				}
			}
		});
});

// drop down menu handler for populating maps
$("#campus-map-dropdown").click(function() {
	logger.silly("Dropdown for map selected");
	dropdownClickCounter++;

	// if the click count is odd, call the API
	// Why? because on collape up we don't want to call it again
	if (dropdownClickCounter & 1) {
		$('#campus-map-dropdown ul').empty();
		$.getJSON("/api/v1/maps/", function(json) {

			if (json.hasOwnProperty('Error')) {
				cmxUtil.displayPopupMessage(json.Error);
				return;
			}
			var totalCampuses = json.campuses.length;
			$('#campus-map-dropdown ul').append('<li class="dropdown-header"><a href="#"><strong>All Campuses</strong>' + ' <br/>Total Campuses ' + totalCampuses + '</a></li>');
			$('#campus-map-dropdown ul').append('<li role="separator" class="divider"></li>');
			logger.debug("Process all campuses for adding to pull down menu");
			for (var a in json.campuses) {
				var campusName = json.campuses[a].name;
				var totalBuildings = json.campuses[a].buildingList.length;
				$('#campus-map-dropdown ul').append('<li class="dropdown-header"><a href="#"><strong>' + campusName + '</strong>' + ' <br/>Total Buildings ' + totalBuildings + '</a></li>');
				$('#campus-map-dropdown ul').append('<li role="separator" class="divider"></li>');
				logger.debug("Process the buildings for campus: " + campusName);
				for (var b in json.campuses[a].buildingList) {
					var buildingName = json.campuses[a].buildingList[b].name;
					var totalFloors = json.campuses[a].buildingList[b].floorList.length;
					logger.debug("Process the floors for campus: " + campusName + " building: " + buildingName);
					$('#campus-map-dropdown ul').append('<li class="dropdown-header"><a href="#"><strong>' + campusName + '>' + buildingName + '</strong>' + ' <br/>Total Floors ' + totalFloors + '</a></li>');
					$('#campus-map-dropdown ul').append('<li role="separator" class="divider"></li>');
					for (var c in json.campuses[a].buildingList[b].floorList) {
						var floorName = json.campuses[a].buildingList[b].floorList[c].name;
						logger.debug("Adding the floor for campus: " + campusName + " building: " + buildingName + " floor: " + floorName);
						$('#campus-map-dropdown ul').append('<li><a href="#"><strong>' + campusName + '>' + buildingName + '>' + floorName + '</strong></a></li>');
					}
					$('#campus-map-dropdown ul').append('<li role="separator" class="divider"></li>');
				}
			}
		});
	}
});

// handler for the campus dropdown selector menu
$('#campus-map-dropdown').on('click', '.option li', function() {
	logger.silly("A dropdown map menu option was selected");
	var i = $(this).parents('.select').attr('id');
	var selectedMapHtml = $(this).children().html();
	selectedMapHtml = selectedMapHtml.substring(selectedMapHtml.indexOf("<strong>") + 8, selectedMapHtml.indexOf("</strong>"));
	logger.debug("Selected HTML map name: " + selectedMapHtml);
	var txt = document.createElement("textarea");
	txt.innerHTML = selectedMapHtml;
	selectedMap = txt.value;
	logger.debug("Parsed selected map name: " + selectedMap);
	var o = $(this).attr('id');
	$('#' + i + ' .selected').attr('id', o);
	if (selectedMap !== null && selectedMap !== undefined) {
		$('#' + i + ' .selected').text(selectedMap);
	}
	if (selectedMap !== null && selectedMap !== undefined && selectedMap !== "All Campuses") {
		logger.debug("Send request to get devices currently exisiting at location: " + selectedMap);
		$.getJSON("/api/v1/notifications/map/" + selectedMap, function(json) {

			if (json.hasOwnProperty('Error')) {
				cmxUtil.displayPopupMessage(json.Error);
				return;
			}

			if (json.devices.length === 0) {
				logger.debug("No devices exist at location: " + selectedMap);
				deviceIds = [];
				// update the table anyway showing no data.
				logger.debug("Send request to get devices currently exisiting at location for the list table: " + selectedMap);
				$('#users-data-table').bootstrapTable('refresh', {
					url: "/api/v1/notifications/devices/" + selectedMap
				});
				return;
			}

			deviceIds = [];
			logger.debug("Found devices at location: " + selectedMap);
			for (var index in json.devices) {
				var deviceId = json.devices[index].macAddress;
				logger.silly("Adding device to list for location: " + selectedMap + " with MAC: " + deviceId);
				deviceIds.push(deviceId);
			}
			$('#zone-map-dropdown ul').empty();
			$('#zone-map-dropdown button').empty();
			$('#zone-map-dropdown button').append('<span class="selected">Zone: All</span> <span class="caret">');
			$('#zone-map-dropdown ul').append('<li><a href="#">Zone: All</a></li>');
			if (json.zones.length > 0) {
				$('#zone-map-dropdown ul').append('<li role="separator" class="divider"></li>');
			}
			logger.debug("Process zones for location: " + selectedMap);
			for (var zoneIndex in json.zones) {
				logger.debug("Add zone for location: " + selectedMap + " zone: " + json.zones[zoneIndex]);
				$('#zone-map-dropdown ul').append('<li><a href="#">Zone: ' + json.zones[zoneIndex] + '</a></li>');
				if (zoneIndex < json.zones.length - 1) {
					$('#zone-map-dropdown ul').append('<li role="separator" class="divider"></li>');
				}
			}

			logger.debug("Send request to get devices currently exisiting at location for the list table: " + selectedMap);
			$('#users-data-table').bootstrapTable('refresh', {
				url: "/api/v1/notifications/devices/" + selectedMap
			});
		});
	} else if (selectedMap !== "" && selectedMap === "All Campuses") {
		logger.debug("Send request to get devices currently exisiting at all campuses");
		$.getJSON("/api/v1/notifications/map/All Campuses", function(json) {

			if (json.hasOwnProperty('Error')) {
				cmxUtil.displayPopupMessage(json.Error);
				return;
			}

			if (json.devices.length === 0) {
				logger.debug("No devices exist at all campuses");
				deviceIds = [];
				// update the table anyway showing no data.
				logger.debug("Send request to get devices currently exisiting at location for the list table on all campuses");
				$('#users-data-table').bootstrapTable('refresh', {
					url: "/api/v1/notifications/devices/All Campuses"
				});
				return;
			}

			deviceIds = [];
			logger.debug("Found devices at all campuses");
			for (var index in json.devices) {
				var deviceId = json.devices[index].macAddress;
				logger.silly("Adding device to list for all campuses with MAC: " + deviceId);
				deviceIds.push(deviceId);
			}
			$('#zone-map-dropdown ul').empty();
			$('#zone-map-dropdown button').empty();
			$('#zone-map-dropdown button').append('<span class="selected">Zone: All</span> <span class="caret">');
			$('#zone-map-dropdown ul').append('<li><a href="#">Zone: All</a></li>');
			$('#zone-map-dropdown ul').append('<li role="separator" class="divider"></li>');

			logger.debug("Send request to get devices currently exisiting at location for the list table on all campuses");
			$('#users-data-table').bootstrapTable('refresh', {
				url: "/api/v1/notifications/devices/All Campuses"
			});
		});
	}
});

// handler for the campus dropdown selector menu
$('#zone-map-dropdown').on('click', '.option li', function() {
	logger.silly("A dropdown zone menu option was selected");
	var i = $(this).parents('.select').attr('id');
	var selectedZoneDesc = $(this).children().text();
	logger.debug("Selected HTML zone name: " + selectedZoneDesc);
	var o = $(this).attr('id');
	$('#' + i + ' .selected').attr('id', o);
	if (selectedZoneDesc !== null && selectedZoneDesc !== undefined) {
		$('#' + i + ' .selected').text(selectedZoneDesc);
	}
	var selectedZone = selectedZoneDesc.substring(6);
	logger.debug("Parsed selected zone name: " + selectedZone);
	if (selectedZone !== null && selectedZone !== undefined && selectedZone !== "All") {
		logger.debug("Send request to get devices currently exisiting at location: " + selectedMap + " and zone: " + selectedZone);
		$.getJSON("/api/v1/notifications/map/" + selectedMap + ">" + selectedZone, function(json) {

			if (json.hasOwnProperty('Error')) {
				cmxUtil.displayPopupMessage(json.Error);
				return;
			}

			if (json.devices.length === 0) {
				logger.debug("No devices exist at location: " + selectedMap + " and zone: " + selectedZone);
				deviceIds = [];
				// update the table anyway showing no data.
				logger.debug("Send request to get devices currently exisiting at location for the list table: " + selectedMap + " and zone: " + selectedZone);
				// update the table anyway showing no data.
				$('#users-data-table').bootstrapTable('refresh', {
					url: "/api/v1/notifications/devices/" + selectedMap + ">" + selectedZone
				});
				return;
			}

			deviceIds = [];
			logger.debug("Found devices at location: " + selectedMap + " and zone: " + selectedZone);
			for (var index in json.devices) {
				var deviceId = json.devices[index].macAddress;
				logger.silly("Adding device to list for location: " + selectedMap + " and zone: " + selectedZone + " with MAC: " + deviceId);
				deviceIds.push(deviceId);
			}

			logger.debug("Send request to get devices currently exisiting at location for the list table: " + selectedMap + " and zone: " + selectedZone);
			$('#users-data-table').bootstrapTable('refresh', {
				url: "/api/v1/notifications/devices/" + selectedMap + ">" + selectedZone
			});
		});
	} else if (selectedZone !== "" && selectedZone === "All") {
		logger.debug("Send request to get devices currently exisiting at location: " + selectedMap + " and all zones");
		$.getJSON("/api/v1/notifications/map/" + selectedMap, function(json) {

			if (json.hasOwnProperty('Error')) {
				cmxUtil.displayPopupMessage(json.Error);
				return;
			}

			if (json.devices.length === 0) {
				logger.debug("No devices exist at location: " + selectedMap + " and all zones");
				deviceIds = [];
				// update the table anyway showing no data.
				logger.debug("Send request to get devices currently exisiting at location for the list table: " + selectedMap + " and all zones");
				$('#users-data-table').bootstrapTable('refresh', {
					url: "/api/v1/notifications/devices/" + selectedMap
				});
				return;
			}

			deviceIds = [];
			logger.debug("Found devices at location: " + selectedMap + " and all zones");
			for (var index in json.devices) {
				var deviceId = json.devices[index].macAddress;
				logger.silly("Adding device to list for location: " + selectedMap + " and all zones with MAC: " + deviceId);
				deviceIds.push(deviceId);
			}

			logger.debug("Send request to get devices currently exisiting at location for the list table: " + selectedMap + " and all zones");
			$('#users-data-table').bootstrapTable('refresh', {
				url: "/api/v1/notifications/devices/" + selectedMap
			});
		});
	}
});

$(window).load(function() {
	// Run code
});

$(function() {
	// Handler for .ready() called. At this point the DOM is ready
	switch (window.location.pathname) {
		case '/':
			loadCounterAll();
			processChart();
			break;
		default:
	}
});

var loadCounterAll = function() {
	$.get("/api/v1/counters/all")
		.done(function(json) {
			if (!json.Error) {
				$("#total-student-users").html(json.totalStudentUsers);
				$("#total-registered-devices").html(json.totalDevices);
				$("#total-active-clients").html(json.totalClients);
			} else {
				$('#error-message').html(json.Error);
				$("#error-result").show();
			}
		});
};

var processChart = function() {
	var url = 'api/v1/graphs';
	$.getJSON(url,
		function(json) {
			var xCategories = [];
			var smsNotifications = [];

			for (var node in json) {
				xCategories.push(json[node].date);
				smsNotifications.push(json[node].smsMessages);
			}

			var options = {
				chart: {
					renderTo: 'sms-graphs',
					type: 'area'
				},
				title: {
					text: 'Monthly SMS Messages Sent'
				},
				xAxis: {
					categories: xCategories
				},
				yAxis: {
					title: {
						text: 'SMS Messages'
					}
				},
				plotOptions: {
					line: {
						dataLabels: {
							enabled: true
						},
						enableMouseTracking: false
					}
				},
				series: [{
					name: 'SMS Messages',
					data: smsNotifications
				}]
			};
			var chart = new Highcharts.Chart(options);
		});
};

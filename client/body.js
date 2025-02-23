// helpers that are used everywhere

UI.registerHelper('s', function() { return s })

UI.registerHelper('date_from_now', function(jsDate) {
	Session.get('refresh_time_field')
	return moment(new Date(jsDate)).fromNow()
})

UI.registerHelper('date_calendar', function(jsDate) {
	Session.get('refresh_time_field')
	return moment(new Date(jsDate)).calendar()
})

UI.registerHelper('date_time', function(jsDate) {
	Session.get('refresh_time_field')
	return moment(new Date(jsDate)).format('h:mm a')
})

UI.registerHelper('date_month_day_year', function(jsDate) {
	return moment(new Date(jsDate)).format('M/D/YY')
})




UI.registerHelper('random_int_1_to_3', function() {
	return Math.floor(Random.fraction() * 3) + 1
})



UI.registerHelper('round', function(num) {
	if (isNaN(num)) {
		return '-'
	} else {
		return round_number(num)
	}
})

UI.registerHelper('round_1', function(num) {
	if (isNaN(num)) {
		return '-'
	} else {
		return round_number_1(num)
	}
})

UI.registerHelper('round_2', function(num) {
	if (isNaN(num)) {
		return '-'
	} else {
		return round_number_2(num)
	}
})

UI.registerHelper('capitalize', function(words) {
	return _.capitalize(words)
})
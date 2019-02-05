import '@polymer/polymer/polymer-legacy.js';
window.D2L = window.D2L || {};
window.D2L.UpcomingAssessments = window.D2L.UpcomingAssessments || {};

/*
* Behavior that performs the minimum necessary date/time functionality required
* @polymerBehavior window.D2L.UpcomingAssessments.DateBehavior
*/
window.D2L.UpcomingAssessments.DateBehavior = {
	/*
	* Returns true if the given activity is "upcoming" (in the future, within the 14-day window
	* starting at the beginning of the current week)
	*/
	isActivityUpcoming: function(activity) {
		var currentDateTime = new Date();
		var activityDate = new Date(activity.dueDate || activity.endDate);

		if (activityDate - currentDateTime > 0) {
			var startOfDay = new Date(currentDateTime).setHours(0, 0, 0, 0);
			var startOfWeek = new Date(startOfDay).setHours(currentDateTime.getDay() * -24);

			return this.getDateDiffInCalendarDays(activityDate, startOfWeek) < 14;
		}

		return false;
	},

	/*
	* Returns the number of calendar days between the give date, and either the reference date if supplied, or now
	*/
	getDateDiffInCalendarDays: function(date, reference) {
		var referenceDate = reference ? new Date(reference) : new Date();
		var activityDate = new Date(date);
		var startOfDay = referenceDate.setHours(0, 0, 0, 0);

		return Math.floor((activityDate - startOfDay) / this._msPerDay);
	},

	_msPerDay: 86400000

};

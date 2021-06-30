'use strict';

describe('date behavior', function() {
	var component;

	function nowish(modifierDays) {
		var date = new Date();
		date.setDate(date.getDate() + modifierDays);
		return date;
	}

	beforeEach(function() {
		component = fixture('date-behavior-fixture');
	});

	describe('isActivityUpcoming', function() {
		[
			{ activity: { dueDate: nowish(0), endDate: null }, due: 'today', end: 'null', result: false },
			{ activity: { dueDate: nowish(1), endDate: null }, due: 'tomorrow', end: 'null', result: true },
			{ activity: { dueDate: nowish(7), endDate: null }, due: 'in 1 week', end: 'null', result: true },
			{ activity: { dueDate: nowish(-1), endDate: null }, due: 'yesterday', end: 'null', result: false },
			{ activity: { dueDate: nowish(15), endDate: null }, due: 'in >2 weeks', end: 'null', result: false },
			{ activity: { dueDate: null, endDate: nowish(0) }, due: 'null', end: 'today', result: false },
			{ activity: { dueDate: null, endDate: nowish(1) }, due: 'null', end: 'tomorrow', result: true },
			{ activity: { dueDate: null, endDate: nowish(7) }, due: 'null', end: 'in 1 week', result: true },
			{ activity: { dueDate: null, endDate: nowish(-1) }, due: 'null', end: 'yesterday', result: false },
			{ activity: { dueDate: null, endDate: nowish(15) }, due: 'null', end: 'in >2 weeks', result: false }
		].forEach(function(testCase) {
			it('returns ' + testCase.result + ' when due date is ' + testCase.due + ' and end date is ' + testCase.end, function() {
				var isUpcoming = component.isActivityUpcoming(testCase.activity);
				expect(isUpcoming).to.equal(testCase.result);
			});
		});
	});

	describe('getDateDiffInCalendarDays', function() {
		[
			{ date: nowish(0), dateStr: 'today', reference: null, refStr: 'today (default)', result: 0 },
			{ date: nowish(1), dateStr: 'tomorrow', reference: null, refStr: 'today (default)', result: 1 },
			{ date: nowish(-1), dateStr: 'yesterday', reference: null, refStr: 'today (default)', result: -1 },
			{ date: nowish(15), dateStr: '15 days from now', reference: null, refStr: 'today (default)', result: 15 },
			{ date: nowish(-15), dateStr: '15 days ago', reference: null, refStr: 'today (default)', result: -15 },
			{ date: nowish(0), dateStr: 'today', reference: nowish(0), refStr: 'today', result: 0 },
			{ date: nowish(1), dateStr: 'tomorrow', reference: nowish(-1), refStr: 'yesterday', result: 2 },
			{ date: nowish(-1), dateStr: 'yesterday', reference: nowish(1), refStr: 'tomorrow', result: -2 },
			{ date: nowish(-15), dateStr: '15 days ago', reference: nowish(15), refStr: '15 days from now', result: -30 }
		].forEach(function(testCase) {
			it(testCase.dateStr + ' is ' + testCase.result + ' days away from ' + testCase.refStr, function() {
				var dateDiff = component.getDateDiffInCalendarDays(testCase.date, testCase.reference);
				expect(dateDiff).to.equal(testCase.result);
			});
		});
	});
});

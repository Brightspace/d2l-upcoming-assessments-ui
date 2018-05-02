/* global describe, it, fixture, expect, beforeEach, sinon */

'use strict';

describe('<d2l-all-assessments-list-item>', function() {
	var element;

	beforeEach(function() {
		element = fixture('basic');
	});

	describe('smoke test', function() {
		it('can be instantiated', function() {
			expect(element.is).to.equal('d2l-all-assessments-list-item');
		});
	});

	function nowish(modifierDays) {
		var date = new Date();
		date.setDate(date.getDate() + modifierDays);
		return date;
	}

	function setAssessmentItem(isDueToday, isOverdue, isEnded, statusConfig, type, userActivityUsageHref) {
		// If due today, 0; if overdue, negative; otherwise, positive
		var dueDateModifier = isDueToday ? 0 : isOverdue ? -3 : 3;
		var endDateModifier = isEnded ? -1 : 5;

		var item = {
			name: 'Name',
			courseName: 'Course',
			info: 'Instructions',
			dueDate: nowish(dueDateModifier),
			endDate: nowish(endDateModifier),
			statusConfig: statusConfig,
			type: type || 'assignment',
			userActivityUsageHref: userActivityUsageHref || null
		};

		element.set('assessmentItem', item);
		Polymer.dom.flush();
	}

	describe('_updateActivityStatus', function() {
		it('should not display the badge when statusConfig is null', function() {
			setAssessmentItem(false, false, false, null, 'assignment', 'https://example.com');
			var statusBadge = element.$$('d2l-status-indicator');
			expect(statusBadge.text).to.eql(null);
			expect(statusBadge.state).to.eql(undefined);
		});

		it('should display the badge when statusConfig has state and text', function() {
			setAssessmentItem(false, false, false, {
				state: 'success',
				text: 'activityComplete'
			}, 'assignment', 'https://example.com');
			var statusBadge = element.$$('d2l-status-indicator');
			expect(statusBadge.text).to.eql('Complete');
			expect(statusBadge.state).to.eql('success');
		});
	});

	describe('getRelativeDateString', function() {
		[
			{ date: nowish(0), dateStr: 'today', result: /^Today$/ },
			{ date: nowish(1), dateStr: 'tomorrow', result: /^Tomorrow$/ },
			{ date: nowish(5), dateStr: 'date within the week', result: /^.*(Sun|Mon|Tues|Wednes|Thurs|Fri|Satur)day.*$/ },
			// The seemingly-extra characters are to fix weird behavior with Sauce and Microsoft Edge
			{ date: nowish(10), dateStr: 'future date', result: /^.*(Sun|Mon|Tues|Wednes|Thurs|Fri|Satur)day.*, .*[A-Z].* .*\d{1,2}$/ },
			{ date: nowish(-1), dateStr: 'yesterday', result: /^.*(Sun|Mon|Tues|Wednes|Thurs|Fri|Satur)day.*, .*[A-Z].* .*\d{1,2}$/ },
			{ date: nowish(-10), dateStr: 'past date', result: /^.*(Sun|Mon|Tues|Wednes|Thurs|Fri|Satur)day.*, .*[A-Z].* .*\d{1,2}$/ }
		].forEach(function(testCase) {
			it('returns correct date string for ' + testCase.dateStr, function() {
				var relativeDateString = element._getRelativeDateString(testCase.date);
				expect(relativeDateString).to.match(testCase.result);
			});
		});
	});

	describe('opening the activity details page', function() {
		var sandbox;
		beforeEach(function() {
			sandbox = sinon.sandbox.create();
			element.dispatchEvent = sandbox.stub();
		});

		afterEach(function() {
			sandbox.restore();
		});

		it('should not dispatch event if activity details is not enabled', function() {
			setAssessmentItem(false, false, false, null, 'assignment', '/user/activity/url');
			element.assignmentDetailsEnabled = false;
			element._openActivityDetails();
			expect(element.dispatchEvent).to.not.be.called;
		});

		it('should not dispatch event for non-assignment assessment items', function() {
			setAssessmentItem(false, false, false, null, 'quiz');
			element.assignmentDetailsEnabled = true;
			element._openActivityDetails();
			expect(element.dispatchEvent).to.not.be.called;
		});

		it('should not dispatch event if userActivityUsageHref is null', function() {
			setAssessmentItem(false, false, false, null, 'assignment');
			element.assignmentDetailsEnabled = true;
			element._openActivityDetails();
			expect(element.dispatchEvent).to.not.be.called;
		});

		it('should dispatch event when all conditions are met', function() {
			setAssessmentItem(false, false, false, null, 'assignment', '/user/activity/url');
			element.assignmentDetailsEnabled = true;
			element._openActivityDetails();
			expect(element.dispatchEvent).to.be.called;
		});
	});

});

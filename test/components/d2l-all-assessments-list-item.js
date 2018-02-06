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

	function setAssessmentItem(isCompleted, isDueToday, isOverdue, isEnded, type, userActivityUsageHref) {
		// If due today, 0; if overdue, negative; otherwise, positive
		var dueDateModifier = isDueToday ? 0 : isOverdue ? -3 : 3;
		var endDateModifier = isEnded ? -1 : 5;

		var item = {
			name: 'Name',
			courseName: 'Course',
			info: 'Instructions',
			dueDate: nowish(dueDateModifier),
			endDate: nowish(endDateModifier),
			isCompleted: isCompleted,
			isDueToday: isDueToday,
			isOverdue: isOverdue,
			isEnded: isEnded,
			type: type || 'assignment',
			userActivityUsageHref: userActivityUsageHref || null
		};

		element.set('assessmentItem', item);
		Polymer.dom.flush();
	}

	[true, false].forEach(function(isCompleted) {
		var completeString = ' is ' + (isCompleted ? '' : 'not') + ' completed';

		[true, false].forEach(function(isDueToday) {
			var dueTodayString = completeString + ' and is ' + (isDueToday ? '' : 'not') + ' due today';

			[true, false].forEach(function(isOverdue) {
				var overdueString = dueTodayString + ' and is ' + (isOverdue ? '' : 'not') + ' overdue';

				[true, false].forEach(function(isEnded) {
					var testName = overdueString + ' and is ' + (isEnded ? '' : 'not') + ' ended';

					describe('when activity' + testName, function() {
						beforeEach(function() {
							setAssessmentItem(isCompleted, isDueToday, isOverdue, isEnded);
						});

						it('should show Complete activity badge correctly', function() {
							var completionInfo = element.$$('d2l-status-indicator[state="success"]');
							expect(completionInfo).to.exist;

							isCompleted
								? expect(completionInfo.getAttribute('hidden')).to.be.null
								: expect(completionInfo.getAttribute('hidden')).to.not.be.null;
						});

						it('should show Due Today badge correctly', function() {
							var dueTodayInfo = element.$$('d2l-status-indicator[state="default"]');
							expect(dueTodayInfo).to.exist;

							!isCompleted && isDueToday
								? expect(dueTodayInfo.getAttribute('hidden')).to.be.null
								: expect(dueTodayInfo.getAttribute('hidden')).to.not.be.null;
						});

						it('should show Overdue badge correctly', function() {
							var overdueInfo = element.$$('d2l-status-indicator[state="alert"]');
							expect(overdueInfo.parentElement).to.exist;

							!isCompleted && isOverdue && !isEnded
								? expect(overdueInfo.parentElement.getAttribute('hidden')).to.be.null
								: expect(overdueInfo.parentElement.getAttribute('hidden')).to.not.be.null;
						});

						it('should show Closed badge correctly', function() {
							var endedInfo = element.$$('d2l-status-indicator[state="null"]');
							expect(endedInfo).to.exist;

							!isCompleted && isEnded
								? expect(endedInfo.getAttribute('hidden')).to.be.null
								: expect(endedInfo.getAttribute('hidden')).to.not.be.null;
						});
					});
				});
			});
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
			setAssessmentItem(false, false, false, false, 'assignment', '/user/activity/url');
			element.assignmentDetailsEnabled = false;
			element._openActivityDetails();
			expect(element.dispatchEvent).to.not.be.called;
		});

		it('should not dispatch event for non-assignment assessment items', function() {
			setAssessmentItem(false, false, false, false, 'quiz');
			element.assignmentDetailsEnabled = true;
			element._openActivityDetails();
			expect(element.dispatchEvent).to.not.be.called;
		});

		it('should not dispatch event if userActivityUsageHref is null', function() {
			setAssessmentItem(false, false, false, false, 'assignment');
			element.assignmentDetailsEnabled = true;
			element._openActivityDetails();
			expect(element.dispatchEvent).to.not.be.called;
		});

		it('should dispatch event when all conditions are met', function() {
			setAssessmentItem(false, false, false, false, 'assignment', '/user/activity/url');
			element.assignmentDetailsEnabled = true;
			element._openActivityDetails();
			expect(element.dispatchEvent).to.be.called;
		});
	});

});

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

	function setAssessmentItem(isCompleted, isDueToday, isOverdue, isEnded, isExempt, type, userActivityUsageHref) {
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
			isExempt: isExempt,
			type: type || 'assignment',
			userActivityUsageHref: userActivityUsageHref || null
		};

		element.set('assessmentItem', item);
		Polymer.dom.flush();
	}

	function addPermutations(permutations, name) {
		var newPermutations = [];
		permutations.forEach(function(permutation) {
			var perm1 = Object.assign({}, permutation);
			perm1[name] = true;
			newPermutations.push(perm1);

			var perm2 = Object.assign({}, permutation);
			perm2[name] = false;
			newPermutations.push(perm2);
		});
		return newPermutations;
	}

	describe('_updateActivityStatus', function() {
		var permutations = addPermutations([{}], 'isCompleted');
		permutations = addPermutations(permutations, 'isDueToday');
		permutations = addPermutations(permutations, 'isOverdue');
		permutations = addPermutations(permutations, 'isEnded');
		permutations = addPermutations(permutations, 'isExempt');

		permutations.forEach(function(permutation) {
			var {isCompleted, isDueToday, isOverdue, isEnded, isExempt} = permutation;
			var testName = `when activity is ${isCompleted ? '' : 'not'} completed`
				+ ` and is ${isDueToday ? '' : 'not'} due today`
				+ ` and is ${isOverdue ? '' : 'not'} overdue`
				+ ` and is ${isEnded ? '' : 'not'} ended`
				+ ` and is ${isExempt ? '' : 'not'} exempt`;

			describe('when activity' + testName, function() {
				beforeEach(function() {
					setAssessmentItem(isCompleted, isDueToday, isOverdue, isEnded, isExempt);
				});

				it('should show Complete activity badge correctly', function() {
					var completionAndExempt = element.querySelectorAll('d2l-status-indicator[state="success"]');

					var completionInfo = Array.prototype.slice.call(completionAndExempt)
						.find(function(statusIndicator) {
							return statusIndicator.firstElementChild.textContent.includes('Complete');
						});
					expect(completionInfo).to.exist;

					isCompleted
						? expect(completionInfo.getAttribute('hidden')).to.be.null
						: expect(completionInfo.getAttribute('hidden')).to.not.be.null;
				});

				it('should show Due Today badge correctly', function() {
					var dueTodayInfo = element.$$('d2l-status-indicator[state="default"]');
					expect(dueTodayInfo).to.exist;

					!isCompleted && isDueToday && !isOverdue && !isExempt
						? expect(dueTodayInfo.getAttribute('hidden')).to.be.null
						: expect(dueTodayInfo.getAttribute('hidden')).to.not.be.null;
				});

				it('should show Overdue badge correctly', function() {
					var overdueInfo = element.$$('d2l-status-indicator[state="alert"]');
					expect(overdueInfo).to.exist;

					!isCompleted && isOverdue && !isEnded && !isExempt
						? expect(overdueInfo.getAttribute('hidden')).to.be.null
						: expect(overdueInfo.getAttribute('hidden')).to.not.be.null;
				});

				it('should show Closed badge correctly', function() {
					var endedInfo = element.$$('d2l-status-indicator[state="null"]');
					expect(endedInfo).to.exist;

					!isCompleted && isEnded
						? expect(endedInfo.getAttribute('hidden')).to.be.null
						: expect(endedInfo.getAttribute('hidden')).to.not.be.null;
				});

				it('should show Exempted badge correctly', function() {
					var completionAndExempt = element.querySelectorAll('d2l-status-indicator[state="success"]');

					var exemptInfo = Array.prototype.slice.call(completionAndExempt)
						.find(function(statusIndicator) {
							return statusIndicator.firstElementChild.textContent.includes('Exempted');
						});
					expect(exemptInfo).to.exist;

					!isCompleted && !isEnded && isExempt
						? expect(exemptInfo.getAttribute('hidden')).to.be.null
						: expect(exemptInfo.getAttribute('hidden')).to.not.be.null;
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
			setAssessmentItem(false, false, false, false, false, 'assignment', '/user/activity/url');
			element.assignmentDetailsEnabled = false;
			element._openActivityDetails();
			expect(element.dispatchEvent).to.not.be.called;
		});

		it('should not dispatch event for non-assignment assessment items', function() {
			setAssessmentItem(false, false, false, false, false, 'quiz');
			element.assignmentDetailsEnabled = true;
			element._openActivityDetails();
			expect(element.dispatchEvent).to.not.be.called;
		});

		it('should not dispatch event if userActivityUsageHref is null', function() {
			setAssessmentItem(false, false, false, false, false, 'assignment');
			element.assignmentDetailsEnabled = true;
			element._openActivityDetails();
			expect(element.dispatchEvent).to.not.be.called;
		});

		it('should dispatch event when all conditions are met', function() {
			setAssessmentItem(false, false, false, false, false, 'assignment', '/user/activity/url');
			element.assignmentDetailsEnabled = true;
			element._openActivityDetails();
			expect(element.dispatchEvent).to.be.called;
		});
	});

});

/* global describe, it, fixture, expect, beforeEach, sinon */

describe('<d2l-all-assessments-list-item>', function() {
	var element;

	beforeEach(function() {
		element = fixture('basic');
		element.flags = {
			assignmentDetailsEnabled: true,
			discussionDetailsEnabled: true
		};
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

	function setAssessmentItem(isDueToday, isOverdue, isEnded, statusConfig, type, userActivityUsageHref, cb) {
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
		flush(cb);
	}

	describe('_updateActivityStatus', function() {
		it('should not display the badge when statusConfig is null', function(done) {
			setAssessmentItem(false, false, false, null, 'assignment', 'https://example.com', function() {
				var statusBadge = element.$$('d2l-status-indicator');
				expect(statusBadge.text || '').to.eql('');
				expect(statusBadge.state).to.eql(undefined);
				done();
			});
		});

		it('should display the badge when statusConfig has state and text', function(done) {
			setAssessmentItem(false, false, false, {
				state: 'success',
				text: 'activityComplete'
			}, 'assignment', 'https://example.com', function() {
				var statusBadge = element.$$('d2l-status-indicator');
				expect(statusBadge.text).to.eql('Complete');
				expect(statusBadge.state).to.eql('success');
				done();
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

		it('should not dispatch event if activity details is not enabled', function(done) {
			element.flags = { assignmentDetailsEnabled: false };
			setAssessmentItem(false, false, false, null, 'assignment', '/user/activity/url', function() {
				element._openActivityDetails();
				expect(element.dispatchEvent).to.not.be.called;
				done();
			});
		});

		it('should not dispatch event for quiz assessment items', function(done) {
			element.flags = { assignmentDetailsEnabled: true };
			setAssessmentItem(false, false, false, null, 'quiz', undefined, function() {
				element._openActivityDetails();
				expect(element.dispatchEvent).to.not.be.called;
				done();
			});
		});

		it('should not dispatch event if userActivityUsageHref is null', function(done) {
			element.flags = { assignmentDetailsEnabled: true };
			setAssessmentItem(false, false, false, null, 'assignment', undefined, function() {
				element._openActivityDetails();
				expect(element.dispatchEvent).to.not.be.called;
				done();
			});
		});

		it('should dispatch event when all conditions are met for an assignment', function(done) {
			element.flags = { assignmentDetailsEnabled: true };
			setAssessmentItem(false, false, false, null, 'assignment', '/user/activity/url', function() {
				element._openActivityDetails();
				expect(element.dispatchEvent).to.be.called;
				done();
			});
		});

		it('should dispatch event when all conditions are met for a discussion', function(done) {
			element.flags = { discussionDetailsEnabled: true };
			setAssessmentItem(false, false, false, null, 'discussion', '/user/activity/url', function() {
				element._openActivityDetails();
				expect(element.dispatchEvent).to.be.called;
				done();
			});
		});
	});

});

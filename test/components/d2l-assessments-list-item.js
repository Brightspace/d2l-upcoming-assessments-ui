/* global describe, it, fixture, expect */

import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

describe('<d2l-assessments-list-item>', function() {

	var element, sandbox;

	function nowish(modifierDays) {
		var date = new Date();
		date.setDate(date.getDate() + modifierDays);
		return date;
	}

	// sets and return activity item
	function setActivityItem(type, completed, userActivityUsageHref, cb) {
		var capitalizedType = type && type[0].toUpperCase() + type.slice(1);
		var activityItem = {
			name: 'Math ' + capitalizedType,
			courseName: 'Math',
			instructionsText: 'Do the math ' + type + ' pls. k thx.',
			itemType: capitalizedType,
			type: type,
			dueDate: '2017-04-06',
			isCompleted: completed,
			userActivityUsageHref: userActivityUsageHref
		};

		element.assessmentItem = activityItem;
		flush(function() {
			cb(activityItem);
		});
	}

	function getEvent(type) {
		var event;
		switch (type) {
			case 'click':
				event = document.createEvent('MouseEvents');
				event.initEvent('tap', true, true);
				return event;
			case 'enter':
				event = document.createEvent('Event');
				event.keyCode = 13;
				event.initEvent('keydown');
				return event;
			case 'space':
				event = document.createEvent('Event');
				event.keyCode = 32;
				event.initEvent('keydown');
				return event;
			case 'tab':
				event = document.createEvent('Event');
				event.keyCode = 9;
				event.initEvent('keydown');
				return event;
			default:
				return;
		}
	}

	beforeEach(function() {
		element = fixture('basic');
		sandbox = sinon.sandbox.create();
		element.flags = {
			assignmentDetailsEnabled: true,
			discussionDetailsEnabled: true
		};
	});

	describe('smoke test', function() {

		it('can be instantiated', function() {
			var element = fixture('basic');
			expect(element.is).to.equal('d2l-assessments-list-item');
		});

	});

	describe('item rendering', function() {

		it('renders the correct data for a quiz', function(done) {
			setActivityItem('quiz', undefined, undefined, (quizItem) => {
				afterNextRender(element, () => {
					expect(element.$$('.assessment-title').textContent).to.equal(quizItem.name);
					expect(element.$$('.course-name').textContent).to.equal(quizItem.courseName);
					expect(element.$$('.assessment-type').textContent).to.equal(quizItem.itemType);
					expect(element.$$('.activity-icon').icon).to.equal('d2l-tier2:quizzing');
					done();
				});
			});
		});

		it('renders the correct data for a discussion', function(done) {
			setActivityItem('discussion', undefined, undefined, (discussionItem) => {
				afterNextRender(element, () => {
					expect(element.$$('.assessment-title').textContent).to.equal(discussionItem.name);
					expect(element.$$('.course-name').textContent).to.equal(discussionItem.courseName);
					expect(element.$$('.assessment-type').textContent).to.equal(discussionItem.itemType);
					expect(element.$$('.activity-icon').icon).to.equal('d2l-tier2:discussions');
					done();
				});
			});
		});

		it('renders the correct data for an assignment', function(done) {
			setActivityItem('assignment', undefined, undefined, (assignmentItem) => {
				afterNextRender(element, () => {
					expect(element.$$('.assessment-title').textContent).to.equal(assignmentItem.name);
					expect(element.$$('.course-name').textContent).to.equal(assignmentItem.courseName);
					expect(element.$$('.assessment-type').textContent).to.equal(assignmentItem.itemType);
					expect(element.$$('.activity-icon').icon).to.equal('d2l-tier2:assignments');
					done();
				});
			});
		});

		it('renders the correct data for a survey', function(done) {
			setActivityItem('survey', undefined, undefined, (surveyItem) => {
				afterNextRender(element, () => {
					expect(element.$$('.assessment-title').textContent).to.equal(surveyItem.name);
					expect(element.$$('.course-name').textContent).to.equal(surveyItem.courseName);
					expect(element.$$('.assessment-type').textContent).to.equal(surveyItem.itemType);
					expect(element.$$('.activity-icon').icon).to.equal('d2l-tier2:surveys');
					done();
				});
			});
		});

		it('renders the correct data for a checklist item', function(done) {
			setActivityItem('checklistItem', undefined, undefined, (checklistItem) => {
				afterNextRender(element, () => {
					expect(element.$$('.assessment-title').textContent).to.equal(checklistItem.name);
					expect(element.$$('.course-name').textContent).to.equal(checklistItem.courseName);
					expect(element.$$('.assessment-type').textContent).to.equal('Checklist Item');
					expect(element.$$('.activity-icon').icon).to.equal('d2l-tier2:checklist');
					done();
				});
			});
		});

		it('has a completion checkmark when completed', function(done) {
			setActivityItem('assignment', true, undefined, () => {
				afterNextRender(element, () => {
					expect(element.$$('.completion-icon')).to.exist;
					done();
				});
			});
		});

		it('doesn\'t have a completion checkmark when not completed', function(done) {
			setActivityItem('quiz', undefined, undefined, () => {
				afterNextRender(element, () => {
					expect(element.$$('.completion-icon')).to.not.exist;
					done();
				});
			});
		});

	});

	describe('getDateString', function() {
		[
			{ date: nowish(0), dateStr: 'today', result: /^Due Today$/ },
			{ date: nowish(1), dateStr: 'tomorrow', result: /^Due Tomorrow$/ },
			{ date: nowish(5), dateStr: 'date within the week', result: /^Due.*(Sun|Mon|Tues|Wednes|Thurs|Fri|Satur)day.*$/ }
		].forEach(function(testCase) {
			it('returns correct string for ' + testCase.dateStr, function() {
				var relativeDateString = element._getDateString(testCase.date, 'dueDateShort', 'dueDate');
				expect(relativeDateString).to.match(testCase.result);
			});
		});
	});

	describe('opening activity details', function() {
		var container;

		beforeEach(function() {
			element.dispatchEvent = sandbox.stub();
			container = element.$$('.activity-container');
		});

		[
			{ assignmentLocation: '/path/to/userActivityUsageAssignment', flags: { activityDetailsEnabled: false }, event: 'click' },
			{ assignmentLocation: '/path/to/userActivityUsageAssignment', flags: { activityDetailsEnabled: false }, event: 'enter' },
			{ assignmentLocation: '/path/to/userActivityUsageAssignment', flags: { activityDetailsEnabled: false }, event: 'space' },
			{ assignmentLocation: null, flags: { activityDetailsEnabled: true }, event: 'click' },
			{ assignmentLocation: null, flags: { activityDetailsEnabled: true }, event: 'enter' },
			{ assignmentLocation: null, flags: { activityDetailsEnabled: true }, event: 'space' },
			{ assignmentLocation: '/path/to/userActivityUsageAssignment', flags: { activityDetailsEnabled: true }, event: 'tab' }
		].forEach(testCase => {
			it(`should not dispatch event if assignment details enabled is ${testCase.flags.activityDetailsEnabled}, userActivityUsageHref is ${testCase.assignmentLocation}, and event is ${testCase.event}`, function(done) {
				element.flags = testCase.flags;
				setActivityItem('assignment', false, testCase.assignmentLocation, () => {
					var processedEvent = getEvent(testCase.event);
					container.dispatchEvent(processedEvent, true);
					expect(element.dispatchEvent).to.not.be.called;
					done();
				});
			});
		});

		[
			{ event: 'click' },
			{ event: 'enter' },
			{ event: 'space' }
		].forEach(testCase => {
			it(`should not dispatch event for quiz grade items and event is ${testCase.event}`, function(done) {
				element.flags = {
					activityDetailsEnabled: true,
					discussionDetailsEnabled: true
				};
				var processedEvent = getEvent(testCase.event);

				setActivityItem('quiz', false, '/path/to/userActivityUsageQuiz', () => {
					container.dispatchEvent(processedEvent);
					afterNextRender(element, () => {
						expect(element.dispatchEvent).to.not.be.called;

						setActivityItem(null, false, null, () => {
							container.dispatchEvent(processedEvent);
							afterNextRender(element, () => {
								expect(element.dispatchEvent).to.not.be.called;
								done();
							});
						});
					});
				});
			});
		});

		[
			{ type: 'assignment', event: 'click' },
			{ type: 'assignment', event: 'enter' },
			{ type: 'assignment', event: 'space' },
			{ type: 'discussion', event: 'click' },
			{ type: 'discussion', event: 'enter' },
			{ type: 'discussion', event: 'space' }
		].forEach(testCase => {
			it(`should dispatch event for ${testCase.type} when all conditions are met and event is ${testCase.event}`, function(done) {
				element.flags = {
					assignmentDetailsEnabled: true,
					discussionDetailsEnabled: true
				};
				setActivityItem(testCase.type, false, '/path/to/userActivityUsageAssignment', () => {
					var processedEvent = getEvent(testCase.event);
					container.dispatchEvent(processedEvent);
					expect(element.dispatchEvent).to.have.been.calledOnce;
					done();
				});
			});
		});
	});

});

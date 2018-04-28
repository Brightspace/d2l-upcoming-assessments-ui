/* global describe, it, expect, fixture, beforeEach, afterEach, sinon */

'use strict';

describe('d2l upcoming assessments behavior', function() {
	var component, sandbox, getToken, userUrl, completionDate, dueDate, endDate;
	var periodUrl = '/some/period/now/';
	var activities = {
		properties: {
			start: '2017-07-19T16:20:07.567Z',
			end: '2017-08-02T16:20:07.567Z'
		}
	};
	var activityHref = '/path/to/activity';
	var activityName = 'Activity Name';
	var activityInstructions = 'Some instructions yo';
	var quizDescription = 'Some description yo';
	var organizationHref = '/path/to/org';
	var organizationName = 'this is the organization name';
	var organization = {
		properties: { name: organizationName },
		links: [{
			rel: ['self'],
			href: organizationHref
		}]
	};

	function nowish(modifierDays) {
		var date = new Date();
		date.setDate(date.getDate() + modifierDays);
		return date;
	}

	function parse(entity) {
		return window.D2L.Hypermedia.Siren.Parse(entity);
	}

	function getUserActivityUsage(type, isComplete, isExempt) {
		var activityRel;
		if (type === 'quiz') {
			activityRel = 'https://api.brightspace.com/rels/quiz';
		} else if (type === 'assignment') {
			activityRel = 'https://api.brightspace.com/rels/assignment';
		}

		var classList = ['activity', 'user-' + type + '-activity'];
		if (isExempt) {
			classList.push('exempt');
		}

		var entity = {
			class: classList,
			entities: [{
				class: ['due-date'],
				properties: { date: dueDate },
				rel: ['https://api.brightspace.com/rels/date']
			}, {
				class: ['end-date'],
				properties: { date: endDate },
				rel: ['https://api.brightspace.com/rels/date']
			}, {
				class: ['completion', isComplete ? 'complete' : 'incomplete'],
				rel: ['item'],
				entities: isComplete ? [{
					class: ['date', 'completion-date'],
					properties: {
						date: completionDate
					},
					rel: ['https://api.brightspace.com/date']
				}] : []
			}],
			links: [{
				rel: ['self'],
				href: '/href/to/userAssignmentUsage'
			}, {
				rel: ['https://api.brightspace.com/rels/organization'],
				href: organizationHref
			}, {
				rel: [activityRel],
				href: activityHref
			}],
			rel: ['https://activities.api.brightspace.com/rels/user-activity-usage']
		};

		return parse(entity);
	}

	function getActivity(type) {
		var subEntities = [];
		if (type === 'quiz') {
			subEntities.push(getDescription());
		} else {
			subEntities.push(getInstructions());
		}
		var entity = {
			class: [type],
			properties: {
				name: activityName
			},
			entities: subEntities,
			links: [{
				rel: ['self'],
				href: activityHref
			}],
			rel: [type === 'assignment' ? 'https://assignments.api.brightspace.com/rels/assignment' : null]
		};

		return parse(entity);
	}

	function getInstructions() {
		return {
			class: ['richtext', 'instructions'],
			properties: {
				text: activityInstructions,
				html: '<p>' + activityInstructions + '</p>'
			},
			rel: ['https://assignments.api.brightspace.com/rels/instructions']
		};
	}

	function getDescription() {
		return {
			class: ['richtext', 'description'],
			properties: {
				text: quizDescription,
				html: '<p>' + quizDescription + '</p>'
			},
			rel: ['https://quizzes.api.brightspace.com/rels/description']
		};
	}

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
		component = fixture('d2l-upcoming-assessments-behavior-fixture');
		userUrl = 'iamauser';
		completionDate = nowish(-1);
		dueDate = nowish(5);
		endDate = nowish(10);

		getToken = function() {
			return Promise.resolve('iamatoken');
		};
	});

	afterEach(function() {
		sandbox.restore();
	});

	['assignment', 'quiz'].forEach(function(type) {
		describe(type, function() {
			describe('_getCompletionState', function() {
				[true, false].forEach(function(isCompleted) {
					it('should return ' + isCompleted + ' when ' + type + (isCompleted ? ' is' : ' is not') + ' complete', function() {
						var usage = getUserActivityUsage(type, isCompleted);

						var completionState = component._getCompletionState(usage);

						expect(completionState.isCompleted).to.equal(isCompleted);
					});
				});
			});

			describe('_getDueDateState', function() {
				[-1, 0, 1].forEach(function(dueDateModifier) {
					it('should return correct state for ' + type + ' with due date ' + dueDateModifier + ' days away', function() {
						dueDate = nowish(dueDateModifier);
						var usage = getUserActivityUsage(type);
						var overdueUserUsages = dueDateModifier < 0 ? [usage] : [];

						var dueDateState = component._getDueDateState(usage, overdueUserUsages);

						expect(dueDateState.dueDate).to.equal(dueDate);
						expect(dueDateState.isOverdue).to.equal(dueDateModifier < 0);
						expect(dueDateState.isDueToday).to.equal(dueDateModifier === 0);
					});
				});
			});

			describe('_getEndDateState', function() {
				[-1, 0, 1].forEach(function(endDateModifier) {
					it('should return correct state for ' + type + ' with end date ' + endDateModifier + ' days away', function() {
						endDate = nowish(endDateModifier);
						var usage = getUserActivityUsage(type);

						var endDateState = component._getEndDateState(usage);

						expect(endDateState.endDate).to.equal(endDate);
						expect(endDateState.isEnded).to.equal(endDateModifier < 0);
					});
				});
			});

			describe('_getActivityType', function() {
				it('should return the correct type for ' + type, function() {
					var activity = getActivity(type);

					var activityType = component._getActivityType(activity);

					expect(activityType).to.equal(type);
				});
			});
		});
	});

	describe('_getAssignmentInstructions', function() {
		it('should return the text value from the richtext instructions entity', function() {
			sandbox.spy(component, '_getRichTextValuePreferPlainText');
			var assignment = getActivity('assignment');
			var instructions = component._getAssignmentInstructions(assignment);

			expect(component._getRichTextValuePreferPlainText).to.be.calledOnce;
			expect(instructions).to.equal(activityInstructions);
		});

	});

	describe('_getQuizDescription', function() {
		it('should return the text value from the richtext description entity', function() {
			sandbox.spy(component, '_getRichTextValuePreferPlainText');
			var quiz = getActivity('quiz');
			var description = component._getQuizDescription(quiz);

			expect(component._getRichTextValuePreferPlainText).to.be.calledOnce;
			expect(description).to.equal(quizDescription);
		});
	});

	describe('_getRichTextValuePreferPlainText', function() {
		it('should return empty string if no object is provided', function() {
			var retval = component._getRichTextValuePreferPlainText();
			expect(retval).to.equal('');
		});

		it('should return empty string if the entity provided does not have the richtext class', function() {
			var retval = component._getRichTextValuePreferPlainText(getActivity('quiz'));
			expect(retval).to.equal('');
		});

		it('should return empty string if both the html and text properties are empty', function() {
			var richtext = getInstructions();
			richtext.properties.text = null;
			richtext.properties.html = null;

			var retval = component._getRichTextValuePreferPlainText(parse(richtext));
			expect(retval).to.equal('');
		});

		it('should prefer the text value from the richtext entity if both text and html are supplied', function() {
			var richtext = getInstructions();

			var retval = component._getRichTextValuePreferPlainText(parse(richtext));
			expect(retval).to.equal(activityInstructions);
		});

		it('should return the html value from the richtext entity if the text value is empty', function() {
			var richtext = getInstructions();
			richtext.properties.text = null;

			var retval = component._getRichTextValuePreferPlainText(parse(richtext));
			expect(retval).to.equal('<p>' + activityInstructions + '</p>');
		});
	});

	describe('_getOrganizationRequest', function() {
		it('should make a request for the organization', function() {
			var usage = getUserActivityUsage('assignment');
			component._fetchEntityWithToken = sandbox.stub();

			component._getOrganizationRequest(usage, getToken, userUrl);

			expect(component._fetchEntityWithToken).to.have.been.called;
		});
	});

	describe('_getActivityRequest', function() {
		it('should make a request for the activity', function() {
			var usage = getUserActivityUsage('assignment');
			component._fetchEntityWithToken = sandbox.stub();

			component._getActivityRequest(usage, getToken, userUrl);

			expect(component._fetchEntityWithToken).to.have.been.called;
		});

		it('should resolve null when the request fails with 4xx', function() {
			var usage = getUserActivityUsage('assignment');
			component._fetchEntityWithToken = sandbox.stub().returns(Promise.reject(404));

			return component._getActivityRequest(usage, getToken, userUrl)
				.then(function(result) {
					expect(result).to.be.null;
				});
		});

		it('should resolve null when the request fails with 4xx', function() {
			var usage = getUserActivityUsage('assignment');
			component._fetchEntityWithToken = sandbox.stub().returns(Promise.reject({ status: 400 }));

			return component._getActivityRequest(usage, getToken, userUrl)
				.then(function(result) {
					expect(result).to.be.null;
				});
		});

		it('should reject when the request fails with server error', function() {
			var usage = getUserActivityUsage('assignment');
			component._fetchEntityWithToken = sandbox.stub().returns(Promise.reject(500));

			return component._getActivityRequest(usage, getToken, userUrl)
				.then(function() {
					return Promise.reject();
				})
				.catch(function(err) {
					expect(err).to.equal(500);
				});
		});
	});

	describe('_getUserActivityUsagesInfos', function() {
		var userUsage, activity, userUsages, overdueUserUsages;

		beforeEach(function() {
			userUsage = getUserActivityUsage('assignment');
			activity = getActivity('assignment');
			userUsages = parse({ entities: [userUsage] });
			overdueUserUsages = parse({ entities: [] });

			component._getOrganizationRequest = sandbox.stub().returns(Promise.resolve(organization));
			component._getActivityRequest = sandbox.stub().returns(Promise.resolve(activity));
		});

		it('should ignore non-supported user activity usages', function() {
			userUsage = getUserActivityUsage('unsupported');
			userUsages = parse({ entities: [userUsage] });

			return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
				.then(function() {
					expect(component._getOrganizationRequest).to.have.not.been.called;
					expect(component._getActivityRequest).to.have.not.been.called;
				});
		});

		it('should call _getOrganizationRequest for the organization', function() {
			return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
				.then(function() {
					expect(component._getOrganizationRequest).to.have.been.called;
				});
		});

		it('should call _getActivityRequest for the activity', function() {
			return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
				.then(function() {
					expect(component._getActivityRequest).to.have.been.called;
				});
		});

		it('should set the info property to the value returned from _getAssignmentInstructions if the activity is an assignment', function() {
			component._getAssignmentInstructions = sandbox.stub().returns('bonita bonita bonita');
			component._getQuizDescription = sandbox.stub().returns('time for new flava in ya ear');

			return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
				.then(function(response) {
					expect(component._getAssignmentInstructions).to.be.called;
					expect(component._getQuizDescription).not.to.be.called;
					expect(response[0].info).to.equal('bonita bonita bonita');
				});
		});

		it('should set the info property to the value returned from _getQuizDescription if the activity is a quiz', function() {
			component._getActivityRequest = sandbox.stub().returns(Promise.resolve(getActivity('quiz')));
			component._getAssignmentInstructions = sandbox.stub().returns('bonita bonita bonita');
			component._getQuizDescription = sandbox.stub().returns('time for new flava in ya ear');

			return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
				.then(function(response) {
					expect(component._getAssignmentInstructions).not.to.be.called;
					expect(component._getQuizDescription).to.be.called;
					expect(response[0].info).to.equal('time for new flava in ya ear');
				});
		});

		it('should fail when all the activity requests fail', function() {
			component._getActivityRequest = sandbox.stub().returns(Promise.resolve(null));

			return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
				.then(function() {
					return Promise.reject('Expect failure');
				})
				.catch(function() {
					return;
				});
		});

		it('should not fail when some of the activity requests fail', function() {
			component._getActivityRequest.onSecondCall().returns(Promise.resolve(null));
			component._getAssignmentInstructions = sandbox.stub().returns('bonita bonita bonita');
			component._getQuizDescription = sandbox.stub().returns('time for new flava in ya ear');

			userUsages = parse({ entities: [userUsage, userUsage] });

			return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
				.then(function(response) {
					expect(component._getAssignmentInstructions).to.be.called;
					expect(component._getQuizDescription).not.to.be.called;
					expect(response[0].info).to.equal('bonita bonita bonita');
				});
		});

		it('should return the correct values for all properties', function() {
			dueDate = nowish(-5);
			endDate = nowish(5);

			component._getCompletionState = sandbox.stub().returns({
				isCompleted: true
			});
			component._getDueDateState = sandbox.stub().returns({
				dueDate: dueDate,
				isOverdue: true,
				isDueToday: false
			});
			component._getEndDateState = sandbox.stub().returns({
				endDate: endDate,
				isEnded: false
			});

			return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
				.then(function(response) {
					expect(response[0].name).to.equal(activityName);
					expect(response[0].courseName).to.equal(organizationName);
					expect(response[0].info).to.equal(activityInstructions);
					expect(response[0].dueDate).to.equal(dueDate);
					expect(response[0].endDate).to.equal(endDate);
					expect(response[0].isCompleted).to.equal(true);
					expect(response[0].isDueToday).to.equal(false);
					expect(response[0].isOverdue).to.equal(true);
					expect(response[0].isEnded).to.equal(false);
					expect(response[0].isExempt).to.equal(false);
					expect(response[0].type).to.equal('assignment');
				});
		});

		it('should return isExempt is true when exempt', function() {
			userUsage = getUserActivityUsage('assignment', false, true);
			userUsages = parse({ entities: [userUsage] });

			return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
				.then(function(response) {
					expect(response[0].isExempt).to.equal(true);
				});
		});
	});

	describe('_getCustomDateRangeParameters', function() {
		it('gets the correct range when selected date is a Tuesday', function() {
			var date = new Date('Tue Sep 12 2017 00:00:00');
			var expected = {
				start: 'Sept 10 2017 00:00:00',
				end: 'Sept 23 2017 23:59:59'
			};
			var range = component._getCustomDateRangeParameters(date);

			var start = new Date(expected.start).toISOString();
			var endDate = new Date(expected.end);
			endDate.setMilliseconds(999);
			var end = endDate.toISOString();

			expect(range.start).to.equal(start);
			expect(range.end).to.equal(end);
		});

		it('gets the correct range when selected date is a Sunday', function() {
			var date = new Date('Sun Sep 03 2017 00:00:00');
			var expected = {
				'start':'Sept 3 2017 00:00:00',
				'end':'Sept 16 2017 23:59:59'
			};
			var range = component._getCustomDateRangeParameters(date);

			var start = new Date(expected.start).toISOString();
			var endDate = new Date(expected.end);
			endDate.setMilliseconds(999);
			var end = endDate.toISOString();

			expect(range.start).to.equal(start);
			expect(range.end).to.equal(end);
		});

		it('gets the correct range when selected date is a Saturday', function() {
			var date = new Date('Sat Aug 26 2017 00:00:00');
			var expected = {
				'start':'Aug 20 2017 00:00:00',
				'end':'Sept 2 2017 23:59:59'
			};

			var range = component._getCustomDateRangeParameters(date);

			var start = new Date(expected.start).toISOString();
			var endDate = new Date(expected.end);
			endDate.setMilliseconds(999);
			var end = endDate.toISOString();

			expect(range.start).to.equal(start);
			expect(range.end).to.equal(end);
		});
	});

	describe('_getCustomRangeAction', function() {
		var periodUrl = '/some/period/now/';
		var activities = {
			properties: {
				start: '2017-07-19T16:20:07.567Z',
				end: '2017-08-02T16:20:07.567Z'
			}
		};

		it('does nothing if the provided url was not set', function() {
			component._fetchEntityWithToken = sandbox.stub();
			return component._getCustomRangeAction()
				.then(function() {
					return Promise.reject('Expected _getCustomRangeAction to reject');
				})
				.catch(function() {
					expect(component._fetchEntityWithToken).to.not.have.been.called;
				});
		});

		it('calls _fetchEntityWithToken for the provided url', function() {
			component._fetchEntityWithToken = sandbox.stub().returns(Promise.resolve(
				window.D2L.Hypermedia.Siren.Parse(activities)
			));
			return component._getCustomRangeAction(periodUrl)
				.then(function() {
					expect(component._fetchEntityWithToken).to.have.been.calledWith(periodUrl);
				});
		});
	});

	describe('_getInfo', function() {
		var customRangeUrl, myActivities, userEntity;

		beforeEach(function() {
			customRangeUrl = 'http://example.com?start=2017-09-20T12:00:00.000Z&end=2017-09-27T12:00:00.000Z';
			myActivities = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
			userEntity = window.D2L.Hypermedia.Siren.Parse({
				entities: [{
					rel: ['https://api.brightspace.com/rels/first-name'],
					properties: {
						name: 'foo'
					}
				}],
				links: [{
					rel: ['https://activities.api.brightspace.com/rels/my-activities'],
					href: 'http://example.com/my-activities'
				}]
			});

			component.isActivityUpcoming = sinon.stub().returns(true);
			component._fetchEntityWithToken = sinon.stub().returns(Promise.resolve(userEntity));
			component._getCustomRangeAction = sinon.stub().returns(Promise.resolve(customRangeUrl));
			component._loadActivitiesForPeriod = sinon.stub().returns(Promise.resolve(myActivities));
		});

		it('should reset the error state', function() {
			component._showError = true;

			return component._getInfo().then(function() {
				expect(component._showError).to.be.false;
			});
		});

		it('should fetch the user entity', function() {
			component.userUrl = 'http://example.com';

			return component._getInfo().then(function() {
				expect(component._fetchEntityWithToken).to.have.been.calledWith('http://example.com');
			});
		});

		it('should set the user\'s name', function() {
			return component._getInfo().then(function() {
				expect(component._firstName).to.equal('foo');
			});
		});

		it('should fetch activities with a custom date range', function() {
			return component._getInfo().then(function() {
				expect(component._getCustomRangeAction).to.have.been.calledWith('http://example.com/my-activities');
			});
		});

		it('should set the error state if things go wrong', function() {
			component._loadActivitiesForPeriod = sinon.stub().returns(Promise.reject());

			return component._getInfo().then(function() {
				expect(component._showError).to.be.true;
			});
		});
	});

	describe('_loadActivitiesForPeriod', function() {

		it('does nothing if the provided url was not set', function() {
			component._fetchEntityWithToken = sandbox.stub();
			return component._loadActivitiesForPeriod()
				.then(function() {
					return Promise.reject('Expected _loadActivitiesForPeriod to reject');
				})
				.catch(function() {
					expect(component._fetchEntityWithToken).to.not.have.been.called;
				});
		});

		it('calls _fetchEntityWithToken for the provided url', function() {
			component._fetchEntityWithToken = sandbox.stub().returns(Promise.resolve(
				window.D2L.Hypermedia.Siren.Parse(activities)
			));
			return component._loadActivitiesForPeriod(periodUrl)
				.then(function() {
					expect(component._fetchEntityWithToken).to.have.been.calledWith(periodUrl);
				});
		});

		it('should update allActivies with the activities in the period', function() {
			var userUsage = {};
			userUsage.getLinkByRel = sandbox.stub().returns();
			userUsage.properties = {
				start: 'start',
				end: 'end'
			};

			component._getFormattedPeriodText = sandbox.stub().returns('dateText');

			component._fetchEntityWithToken = sandbox.stub().returns(Promise.resolve(userUsage));
			component._getOverdueActivities = sandbox.stub().returns(activities);
			component._getUserActivityUsagesInfos = sandbox.stub().returns(activities);
			component._updateActivitiesInfo = sandbox.stub().returns(activities);
			return component._loadActivitiesForPeriod(periodUrl)
				.then(function() {
					expect(component._allActivities).to.equal(activities);
				});
		});

		it('should not update the assessments with the activities in the period', function() {
			var userUsage = {};
			userUsage.getLinkByRel = sandbox.stub().returns();
			userUsage.properties = {
				start: 'start',
				end: 'end'
			};

			component._getFormattedPeriodText = sandbox.stub().returns('dateText');

			component._fetchEntityWithToken = sandbox.stub().returns(Promise.resolve(userUsage));
			component._getOverdueActivities = sandbox.stub().returns(activities);
			component._getUserActivityUsagesInfos = sandbox.stub().returns(activities);
			component._updateActivitiesInfo = sandbox.stub().returns(activities);
			return component._loadActivitiesForPeriod(periodUrl)
				.then(function() {
					expect(component._assessments).to.not.equal(activities);
				});
		});

	});

});

/* global describe, it, expect, fixture, beforeEach, afterEach, sinon */

'use strict';

describe('d2l upcoming assessments behavior', function() {
	var component, sandbox, getToken, userUrl, completionDate, dueDate, endDate;
	var activityHref = '/path/to/activity';
	var activityName = 'Activity Name';
	var activityInstructions = 'Some instructions yo';
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

	function getUserActivityUsage(type, isComplete) {
		var activityRel;
		if (type === 'quiz') {
			activityRel = 'https://api.brightspace.com/rels/quiz';
		} else if (type === 'assignment') {
			activityRel = 'https://api.brightspace.com/rels/assignment';
		}

		var entity = {
			class: ['activity', 'user-' + type + '-activity'],
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
		var entity = {
			class: [type],
			properties: {
				name: activityName,
				instructionsText: activityInstructions
			},
			links: [{
				rel: ['self'],
				href: activityHref
			}],
			rel: [type === 'assignment' ? 'https://assignments.api.brightspace.com/rels/assignment' : null]
		};

		return parse(entity);
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

	describe('_getOrganizationRequest', function() {
		it('should make a request for the organization', function() {
			var usage = getUserActivityUsage('assignment');
			component._fetchEntity = sandbox.stub();

			component._getOrganizationRequest(usage, getToken, userUrl);

			expect(component._fetchEntity).to.have.been.called;
		});
	});

	describe('_getActivityRequest', function() {
		it('should make a request for the activity', function() {
			var usage = getUserActivityUsage('assignment');
			component._fetchEntity = sandbox.stub();

			component._getActivityRequest(usage, getToken, userUrl);

			expect(component._fetchEntity).to.have.been.called;
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

		it('should fall back to the activity instructions property if instructionsText is null', function() {
			var activityWithInstructions = JSON.parse(JSON.stringify(activity));
			activityWithInstructions.properties.instructionsText = null;
			activityWithInstructions.properties.instructions = 'some other text';

			component._getActivityRequest.returns(Promise.resolve(parse(activityWithInstructions)));

			return component._getUserActivityUsagesInfos(userUsages, overdueUserUsages, getToken, userUrl)
				.then(function(response) {
					expect(response[0].instructions).to.equal('some other text');
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
					expect(response[0].instructions).to.equal(activityInstructions);
					expect(response[0].dueDate).to.equal(dueDate);
					expect(response[0].endDate).to.equal(endDate);
					expect(response[0].isCompleted).to.equal(true);
					expect(response[0].isDueToday).to.equal(false);
					expect(response[0].isOverdue).to.equal(true);
					expect(response[0].isEnded).to.equal(false);
					expect(response[0].type).to.equal('assignment');
				});
		});
	});

	describe('_fetchEntity', function() {
		var getRejected, getNoken;

		beforeEach(function() {
			component._makeRequest = sandbox.stub().returns(Promise.resolve());
			getRejected = function() {
				return Promise.reject(new Error('Rejected rejected denied'));
			};
			getNoken = function() {
				return Promise.resolve(null);
			};
		});

		[
			{ parm1: 'url', parm2: null, parm3: null },
			{ parm1: null, parm2: getToken, parm3: null },
			{ parm1: null, parm2: null, parm3: 'url'}
		].forEach(function(testcase) {
			it('should not make request if getToken or url is not provided', function() {
				component._fetchEntity(testcase.parm1, testcase.parm2, testcase.parm3);
				expect(component._makeRequest.called).to.be.false;
			});
		});

		it('should make request when getToken and url are provided', function() {
			return component._fetchEntity('url', getToken, null)
				.then(function() {
					expect(component._makeRequest.called).to.be.true;
				});
		});

		it('should make request when getToken, url and userUrl are provided', function() {
			return component._fetchEntity('url', getToken, 'userUrl')
				.then(function() {
					expect(component._makeRequest.called).to.be.true;
				});
		});

		it('should make request when getToken is previous set and url is provided', function() {
			return component._fetchEntity('url', getToken, null)
				.then(function() {
					expect(component._makeRequest.called).to.be.true;
				});
		});

		it('should not make request when getToken rejects', function() {
			return component._fetchEntity('url', getRejected, null)
				.then(function() {
					expect(component._makeRequest.called).to.be.false;
				}, function() {
					expect(component._makeRequest.called).to.be.false;
				});
		});

		it('should not make request when token is not a string', function() {
			return component._fetchEntity('url', getNoken, null)
				.then(function() {
					expect(component._makeRequest.called).to.be.false;
				}, function() {
					expect(component._makeRequest.called).to.be.false;
				});
		});
	});
});

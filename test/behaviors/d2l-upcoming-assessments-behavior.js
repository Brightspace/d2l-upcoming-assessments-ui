import SirenParse from 'siren-parser';
import './d2l-upcoming-assessments-behavior-consumer.js';

describe('d2l upcoming assessments behavior', function() {
	var component, sandbox, getToken, userUrl, completionDate, dueDate, endDate;
	var activities = {
		properties: {
			start: '2017-07-19T16:20:07.567Z',
			end: '2017-08-02T16:20:07.567Z'
		}
	};
	const activitiesEntity = {
		links: [{
			rel: ['https://activities.api.brightspace.com/rels/overdue'],
			href: 'http://www.foo.com/overdue'
		}],
		actions: [{
			name: 'select-custom-date-range',
			href: 'http://www.foo.com',
			method: 'GET',
			fields: [{
				name:'start',
				type:'text',
				value:'2017-09-26T19:14:21.889Z'
			}, {
				name:'end',
				type:'text',
				value:'2017-10-03T19:14:21.889Z'
			}]
		}]
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
		return SirenParse(entity);
	}

	function getUserActivityUsage(type, isComplete, isExempt, isModuleContent) {
		var classList = ['activity', 'user-' + type + '-activity'];
		if (isExempt) {
			classList.push('exempt');
		}

		var activityRel;
		if (type === 'quiz') {
			activityRel = 'https://api.brightspace.com/rels/quiz';
		} else if (type === 'assignment') {
			activityRel = 'https://api.brightspace.com/rels/assignment';
		} else if (type === 'content') {
			activityRel = 'https://api.brightspace.com/rels/content';
			classList.push(isModuleContent ? 'module' : 'topic');
		} else if (type === 'discussion') {
			activityRel = 'https://discussions.api.brightspace.com/rels/topic';
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
		if (type === 'quiz' || type === 'discussion') {
			subEntities.push(getDescription());
		} else {
			subEntities.push(getInstructions());
		}
		var activityClass;

		var rel;
		switch (type) {
			case 'assignment':
				rel = 'https://api.brightspace.com/rels/assignment';
				activityClass = type;
				break;
			case 'discussion':
				rel = 'https://discussions.api.brightspace.com/rels/topic';
				activityClass = 'topic';
				break;
			case 'quiz':
				rel = 'https://api.brightspace.com/rels/quiz';
				activityClass = type;
				break;
			case 'content':
				rel = 'https://api.brightspace.com/rels/content';
				activityClass = 'sequenced-activity';
				break;
		}

		var entity = {
			class: [activityClass],
			properties: {
				name: activityName
			},
			entities: subEntities,
			links: [{
				rel: ['self'],
				href: activityHref
			}],
			rel: [rel]
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

	['assignment', 'quiz', 'content'].forEach(function(type) {
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
						dueDate.setMinutes(dueDate.getMinutes() + 5);
						var usage = getUserActivityUsage(type);
						var overdueUserUsages = dueDateModifier < 0 ? [usage] : [];

						var dueDateState = component._getDueDateState(usage, overdueUserUsages);

						expect(dueDateState.dueDate).to.deep.equal(dueDate);
						expect(dueDateState.isOverdue).to.equal(dueDateModifier < 0);
						expect(dueDateState.isDueToday).to.equal(dueDateModifier === 0);
					});
				});
			});

			describe('_getEndDateState', function() {
				[-1, 0, 1].forEach(function(endDateModifier) {
					it('should return correct state for ' + type + ' with end date ' + endDateModifier + ' days away', function() {
						endDate = nowish(endDateModifier);
						endDate.setMinutes(endDate.getMinutes() + 5);
						var usage = getUserActivityUsage(type);

						var endDateState = component._getEndDateState(usage);

						expect(endDateState.endDate).to.deep.equal(endDate);
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

	['quiz', 'assignment', 'discussion', 'content'].forEach(function(type) {
		describe('_findActivityHref ' + type, function() {
			it('should find the activityHref', function() {
				var activityUsage = getUserActivityUsage(type);
				var result = component._findActivityHref(activityUsage);
				expect(result).to.equal(activityHref);
			});
		});
	});

	describe('_getInstructions assignment', function() {
		it('should return the text value from the richtext instructions entity', function() {
			sandbox.spy(component, '_getRichTextValuePreferPlainText');
			var assignment = getActivity('assignment');
			var instructions = component._getInstructions('assignment', assignment);

			expect(component._getRichTextValuePreferPlainText).to.be.calledOnce;
			expect(instructions).to.equal(activityInstructions);
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

			return component._getUserActivityUsagesInfos(userUsages.entities, overdueUserUsages.entities, getToken, userUrl)
				.then(function() {
					expect(component._getOrganizationRequest).to.have.not.been.called;
					expect(component._getActivityRequest).to.have.not.been.called;
				});
		});

		it('should ignore content module user activity usages', function() {
			userUsage = getUserActivityUsage('content', false, false, true);
			userUsages = parse({ entities: [userUsage] });

			return component._getUserActivityUsagesInfos(userUsages.entities, overdueUserUsages.entities, getToken, userUrl)
				.then(function() {
					expect(component._getOrganizationRequest).to.have.not.been.called;
					expect(component._getActivityRequest).to.have.not.been.called;
				});
		});

		it('should include content topic user activity usages', function() {
			userUsage = getUserActivityUsage('content', false, false, false);
			userUsages = parse({ entities: [userUsage] });

			return component._getUserActivityUsagesInfos(userUsages.entities, overdueUserUsages.entities, getToken, userUrl)
				.then(function() {
					expect(component._getOrganizationRequest).to.have.been.called;
					expect(component._getActivityRequest).to.have.been.called;
				});
		});

		it('should call _getOrganizationRequest for the organization', function() {
			return component._getUserActivityUsagesInfos(userUsages.entities, overdueUserUsages.entities, getToken, userUrl)
				.then(function() {
					expect(component._getOrganizationRequest).to.have.been.called;
				});
		});

		it('should call _getActivityRequest for the activity', function() {
			return component._getUserActivityUsagesInfos(userUsages.entities, overdueUserUsages.entities, getToken, userUrl)
				.then(function() {
					expect(component._getActivityRequest).to.have.been.called;
				});
		});

		it('should set the info property to the value returned from _getInstructions', function() {
			component._getInstructions = sandbox.stub().returns('bonita bonita bonita');

			return component._getUserActivityUsagesInfos(userUsages.entities, overdueUserUsages.entities, getToken, userUrl)
				.then(function(response) {
					expect(component._getInstructions).to.be.called;
					expect(response[0].info).to.equal('bonita bonita bonita');
				});
		});

		it('should fail when all the activity requests fail', function() {
			component._getActivityRequest = sandbox.stub().returns(Promise.resolve(null));

			return component._getUserActivityUsagesInfos(userUsages.entities, overdueUserUsages.entities, getToken, userUrl)
				.then(function() {
					return Promise.reject('Expect failure');
				})
				.catch(function() {
					return;
				});
		});

		it('should not fail when some of the activity requests fail', function() {
			component._getActivityRequest.onSecondCall().returns(Promise.resolve(null));
			component._getInstructions = sandbox.stub().returns('bonita bonita bonita');

			userUsages = parse({ entities: [userUsage, userUsage] });

			return component._getUserActivityUsagesInfos(userUsages.entities, overdueUserUsages.entities, getToken, userUrl)
				.then(function(response) {
					expect(component._getInstructions).to.be.called;
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

			component._getExemptState = sandbox.stub().returns({
				isExempt: false
			});

			component._createStatusConfig = sandbox.stub().returns({
				state: 'success',
				text: 'complete'
			});

			return component._getUserActivityUsagesInfos(userUsages.entities, overdueUserUsages.entities, getToken, userUrl)
				.then(function(response) {
					expect(response[0].name).to.equal(activityName);
					expect(response[0].courseName).to.equal(organizationName);
					expect(response[0].info).to.equal(activityInstructions);
					expect(response[0].dueDate).to.equal(dueDate);
					expect(response[0].endDate).to.equal(endDate);
					expect(response[0].statusConfig.state).to.equal('success');
					expect(response[0].statusConfig.text).to.equal('complete');
					expect(response[0].type).to.equal('assignment');
					expect(response[0].isCompleted).to.equal(true);
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
		it('returns a URL for the correct period', function() {
			const parsedActivitiesEntity = SirenParse(activitiesEntity);
			const testDate = new Date(2019, 0, 29);
			const actionUrl = component._getCustomRangeAction(parsedActivitiesEntity, testDate);
			const expectedStartDate = new Date(2019, 0, 27, 0, 0, 0, 0).toISOString();
			const expectedEndDate = new Date(2019, 1, 9, 23, 59, 59, 999).toISOString();

			expect(actionUrl).to.equal(`http://www.foo.com?start=${expectedStartDate}&end=${expectedEndDate}`);
		});
	});

	describe('_getInfo', function() {
		var customRangeUrl, myActivities, userEntity;

		beforeEach(function() {
			customRangeUrl = 'http://example.com?start=2017-09-20T12:00:00.000Z&end=2017-09-27T12:00:00.000Z';
			myActivities = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
			userEntity = {
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
			};

			const fetchEntityStub = sinon.stub();
			fetchEntityStub.onFirstCall().returns(Promise.resolve(SirenParse(userEntity)));
			fetchEntityStub.onSecondCall().returns(Promise.resolve(SirenParse(activitiesEntity)));

			component.isActivityUpcoming = sinon.stub().returns(true);
			component._fetchEntityWithToken = fetchEntityStub;
			component._getCustomRangeAction = sinon.stub().returns(customRangeUrl);
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
				expect(component._fetchEntityWithToken.getCall(0).args[0].link).to.equal('http://example.com');
			});
		});

		it('should set the user\'s name', function() {
			return component._getInfo().then(function() {
				expect(component._firstName).to.equal('foo');
			});
		});

		[{
			description: 'should use the my-activities link relation when my-activities#empty is not available',
			expectedLink: 'http://example.com/my-activities',
			links: [{
				rel: ['https://activities.api.brightspace.com/rels/my-activities'],
				href: 'http://example.com/my-activities'
			}]
		}, {
			description: 'should use the my-activities#empty link relation when available',
			expectedLink: 'http://example.com/my-activities#empty',
			links: [{
				rel: ['https://activities.api.brightspace.com/rels/my-activities'],
				href: 'http://example.com/my-activities'
			}, {
				rel: ['https://activities.api.brightspace.com/rels/my-activities#empty'],
				href: 'http://example.com/my-activities#empty'
			}]
		}].forEach(ctx => {
			it(ctx.description, function() {
				const parsedUserEntity = SirenParse(
					Object.assign({}, userEntity, {
						links: ctx.links
					})
				);

				component._fetchEntityWithToken.onFirstCall().returns(Promise.resolve(parsedUserEntity));

				return component._getInfo().then(function() {
					expect(component._fetchEntityWithToken.getCall(1).args[0].link).to.equal(ctx.expectedLink);
				});
			});
		});

		it('should set the error state if things go wrong', function() {
			component._loadActivitiesForPeriod = sinon.stub().returns(Promise.reject(Error()));

			return component._getInfo().then(function() {
				expect(component._showError).to.be.true;
			});
		});
	});

	describe('_loadActivitiesForPeriod', function() {
		let userUsage;

		beforeEach(function() {
			userUsage = {
				getLinkByRel: sandbox.stub().returns(),
				properties: {
					start: 'start',
					end: 'end'
				}
			};
			userUsage.getLinkByRel = sandbox.stub().returns();

			component._fetchEntityWithToken = sandbox.stub().returns(Promise.resolve(userUsage));
			component._getOverdueActivities = sandbox.stub().returns(activities);
			component._getUserActivityUsagesInfos = sandbox.stub().returns(activities);
			component._updateActivitiesInfo = sandbox.stub().returns(activities);
		});

		it('should try to fetch activities for the correct period', function() {
			const startDate = new Date(2017, 6, 16).toISOString();
			const endDate = new Date(2017, 6, 29, 23, 59, 59, 999).toISOString();

			const parsedActivitiesEntity = SirenParse(activitiesEntity);

			return component._loadActivitiesForPeriod({
				activitiesEntity: parsedActivitiesEntity,
				dateObj: new Date('2017-07-21T16:20:07.567Z'),
				getToken: getToken,
				userUrl: userUrl,
			})
				.then(function() {
					expect(component._fetchEntityWithToken.getCall(0).args[0].link).to.equal(`http://www.foo.com?start=${startDate}&end=${endDate}`);
					expect(component._allActivities).to.equal(activities);
				});
		});

		it('should not update the assessments with the activities in the period', function() {
			const parsedActivitiesEntity = SirenParse(activitiesEntity);

			return component._loadActivitiesForPeriod({
				activitiesEntity: parsedActivitiesEntity,
				dateObj: new Date('2017-07-21T16:20:07.567Z'),
				getToken: getToken,
				userUrl: userUrl,
			})
				.then(function() {
					expect(component._assessments).to.not.equal(activities);
				});
		});

	});

	describe('_createStatusConfig', function() {
		var permutations = addPermutations([{}], 'isCompleted');
		permutations = addPermutations(permutations, 'isDueToday');
		permutations = addPermutations(permutations, 'isOverdue');
		permutations = addPermutations(permutations, 'isEnded');
		permutations = addPermutations(permutations, 'isExempt');
		permutations = addPermutations(permutations, 'endsToday');

		permutations.forEach(function(permutation) {
			var { isCompleted, isDueToday, isOverdue, isEnded, isExempt, endsToday } = permutation;
			var testName = `when activity is ${isCompleted ? '' : 'not'} completed`
					+ ` and is ${isDueToday ? '' : 'not'} due today`
					+ ` and is ${isOverdue ? '' : 'not'} overdue`
					+ ` and is ${isEnded ? '' : 'not'} ended`
					+ ` and is ${isExempt ? '' : 'not'} exempt`
					+ ` and is ${endsToday ? '' : 'not'} ending today`;

			describe(testName, function() {
				it('should return statusConfig correctly', function() {
					var statusConfig = component._createStatusConfig(isCompleted, isEnded, isExempt, isOverdue, isDueToday, endsToday);
					expect(!!statusConfig).to.eql(
						isCompleted || isDueToday || isOverdue || isEnded || isExempt || endsToday
					);
				});

				it('should set complete correctly', function() {
					var statusConfig = (component._createStatusConfig(isCompleted, isEnded, isExempt, isOverdue, isDueToday, endsToday) || {});
					expect(statusConfig.state === 'success').to.eql(
						isCompleted || (!isCompleted && !isEnded && isExempt)
					);
					expect(statusConfig.text === 'activityComplete').to.eql(
						isCompleted
					);
				});

				it('should set closed correctly', function() {
					var statusConfig = (component._createStatusConfig(isCompleted, isEnded, isExempt, isOverdue, isDueToday, endsToday) || {});
					expect(statusConfig.state === 'null').to.eql(
						!isCompleted && isEnded
					);
					expect(statusConfig.text === 'activityEnded').to.eql(
						!isCompleted && isEnded
					);
				});

				it('should set overdue correctly', function() {
					var statusConfig = (component._createStatusConfig(isCompleted, isEnded, isExempt, isOverdue, isDueToday, endsToday) || {});
					expect(statusConfig.state === 'alert').to.eql(
						!isCompleted && !isEnded && !isExempt && isOverdue
					);
					expect(statusConfig.text === 'activityOverdue').to.eql(
						!isCompleted && !isEnded && !isExempt && isOverdue
					);
				});

				it('should set due today correctly', function() {
					var statusConfig = (component._createStatusConfig(isCompleted, isEnded, isExempt, isOverdue, isDueToday, endsToday) || {});
					var shouldShowDueToday = !isCompleted && !isEnded && !isExempt && !isOverdue && isDueToday;
					if (shouldShowDueToday) {
						expect(statusConfig.state === 'default').to.eql(true);
						expect(statusConfig.text === 'activityDueToday').to.eql(true);
					}
				});

				it('should set exempted correctly', function() {
					var statusConfig = (component._createStatusConfig(isCompleted, isEnded, isExempt, isOverdue, isDueToday, endsToday) || {});
					expect(statusConfig.state === 'success').to.eql(
						isCompleted || (!isCompleted && !isEnded && isExempt)
					);
					expect(statusConfig.text === 'activityExempted').to.eql(
						!isCompleted && !isEnded && isExempt
					);
				});

				it('should set ends today correctly', function() {
					var statusConfig = (component._createStatusConfig(isCompleted, isEnded, isExempt, isOverdue, isDueToday, endsToday) || {});
					var shouldShowEndsToday = !(isCompleted || isDueToday || isOverdue || isEnded || isExempt) && endsToday;
					if (shouldShowEndsToday) {
						expect(statusConfig.state === 'default').to.eql(true);
						expect(statusConfig.text === 'activityEndsToday').to.eql(true);
					}
				});
			});
		});
	});

	describe('activity usage flattening', function() {
		var userContentActivity = {
			'class': [
				'user-content-activity',
				'topic',
				'activity'
			],
			'rel': [
				'https://activities.api.brightspace.com/rels/user-activity-usage'
			],
			'entities': [{
				'class': [
					'user-checklist-activity', 'activity'
				],
				'rel': [
					'https://activities.api.brightspace.com/rels/child-user-activity-usage'
				],
				'href': 'https://38401c30-1afc-4ce9-b4df-b115908e21c2.activities.api.proddev.d2l/activities/6606_61000_1/usages/6609/users/14291'
			}, {
				'class': ['date', 'due-date'],
				'rel': [
					'https://api.brightspace.com/rels/date'
				],
				'properties': {
					'date': '2019-03-13T22:00:00.000Z'
				}
			}, {
				'rel': ['https://activities.api.brightspace.com/rels/completion']
			}],
			'links': [{
				'rel': [
					'https://activities.api.brightspace.com/rels/user-activity-usage',
					'self'
				],
				'href': 'https://38401c30-1afc-4ce9-b4df-b115908e21c2.activities.api.proddev.d2l/activities/6606_37000_97666/usages/6609/users/14291'
			}]
		};

		const hydratedChildActivity = {
			'class': [
				'user-checklist-activity',
				'activity'
			],
			'rel': [
				'https://activities.api.brightspace.com/rels/user-activity-usage'
			],
			'entities': [{
				'class': ['date', 'due-date'],
				'rel': [
					'https://api.brightspace.com/rels/date'
				],
				'properties': {
					'date': '2019-03-14T22:15:00.000Z'
				}
			},
			{
				'class': ['date', 'end-date'],
				'rel': ['https://api.brightspace.com/rels/date'],
				'properties': {
					'date': '2019-03-14T22:15:00.000Z'
				}
			},
			{
				'class': ['completion', 'incomplete'],
				'rel': [
					'item',
					'https://activities.api.brightspace.com/rels/completion'
				]
			}],
			'links': [{
				'rel': [
					'https://activities.api.brightspace.com/rels/user-activity-usage',
					'self'
				],
				'href': 'https://38401c30-1afc-4ce9-b4df-b115908e21c2.activities.api.proddev.d2l/activities/6606_61000_1/usages/6609/users/14291'
			}]
		};

		const linkedActivitySubentity = {
			'class': [
				'user-checklist-activity', 'activity'
			],
			'rel': [
				'https://activities.api.brightspace.com/rels/child-user-activity-usage'
			],
			'href': 'https://38401c30-1afc-4ce9-b4df-b115908e21c2.activities.api.proddev.d2l/activities/6606_61000_1/usages/6609/users/14291'
		};

		it('uses content topic linked child subentity if no hydrated version exists', function() {
			var result = component._createNormalizedEntityMap([
				userContentActivity
			]);

			var resultActivities = Array.from(result.activitiesMap.values());

			// Parsing trashes href on entity without parent
			var linkedSubentity = SirenParse(linkedActivitySubentity);
			linkedSubentity.href = linkedActivitySubentity.href;

			expect(resultActivities.length).to.equal(2);
			expect(resultActivities).to.deep.include(SirenParse(userContentActivity));
			expect(resultActivities).to.deep.include(linkedSubentity);
		});

		it('prefers hydrated versions of entities', function() {
			const result = component._createNormalizedEntityMap([
				userContentActivity,
				hydratedChildActivity,
			]);

			var resultActivities = Array.from(result.activitiesMap.values());

			expect(resultActivities.length).to.equal(2);
			expect(resultActivities).to.deep.include(SirenParse(userContentActivity));
			expect(resultActivities).to.deep.include(SirenParse(hydratedChildActivity));
		});

		it('maintains a map of child -> parent relationships', function() {
			var result = component._createNormalizedEntityMap([
				userContentActivity
			]);

			expect(result.parentActivitiesMap.has(linkedActivitySubentity.href));
			expect(result.parentActivitiesMap.get(linkedActivitySubentity.href).getLinkByRel('self').href).to.equal(
				SirenParse(userContentActivity).getLinkByRel('self').href
			);
		});
	});
});

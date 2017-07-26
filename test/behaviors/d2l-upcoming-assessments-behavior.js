/* global describe, it, expect, fixture, beforeEach, afterEach, sinon */

'use strict';

describe('d2l upcoming assessments behavior', function() {
	var component, sandbox, token;

	beforeEach(function() {
		component = fixture('d2l-upcoming-assessments-behavior-fixture');
		sandbox = sinon.sandbox.create();
		token = 'iamatoken';
	});

	afterEach(function() {
		sandbox.restore();
	});

	describe('_getActivityUsagesInfo', function() {

		var activityUsageHref = '/path/to/activity-usage';
		var activityUsageHref2 = '/path/to/another/activity-usage';
		var activityUsageHref3 = '/some/other/definitely/not/the/same';
		var overdueHref = '/path/to/overdue/things';
		var organizationHref = '/path/to/org';

		var baseUserAssignmentActivity = {
			class: ['activity', 'user-assignment-activity'],
			entities: [],
			links: [{
				rel: ['self'],
				href: '/path/to/activity'
			}, {
				rel: ['https://activities.api.brightspace.com/rels/activity-usage'],
				href: activityUsageHref
			}, {
				rel: ['https://api.brightspace.com/rels/organization'],
				href: organizationHref
			}],
			rel: ['https://activities.api.brightspace.com/rels/user-activity-usage']
		};
		var completionEntity = {
			class: ['completion', 'complete'],
			entities: [{
				class: ['date', 'completion-date'],
				properties: {
					date: '2017-07-21T20:18:13.310Z'
				},
				rel: ['https://api.brightspace.com/rels/date']
			}],
			rel: ['item']
		};
		var dueDateEntity = {
			class: ['date', 'due-date'],
			properties: {
				date: '2017-07-27T18:53:00.000Z'
			},
			rel: ['https://api.brightspace.com/rels/date']
		};

		var incompleteActivity = JSON.parse(JSON.stringify(baseUserAssignmentActivity));
		incompleteActivity.entities.push(dueDateEntity);

		var completeActivity = JSON.parse(JSON.stringify(baseUserAssignmentActivity));
		completeActivity.entities.push(dueDateEntity);
		completeActivity.entities.push(completionEntity);

		beforeEach(function() {
			component._fetchEntity = sandbox.stub().returns(Promise.resolve({}));
		});

		it('should make no requests to _fetchEntity if no activities are provided', function() {
			var activities = window.D2L.Hypermedia.Siren.Parse({});
			return component._getActivityUsagesInfo(activities, token)
				.then(function() {
					expect(component._fetchEntity).to.not.have.been.called;
				});
		});

		it('should make no requests to _fetchEntity if none of the provided activities have a due date', function() {
			var activities = window.D2L.Hypermedia.Siren.Parse(baseUserAssignmentActivity);
			return component._getActivityUsagesInfo(activities, token)
				.then(function() {
					expect(component._fetchEntity).to.not.have.been.called;
				});
		});

		it('should make a request to _fetchEntity for the activity usage link if the provided activity has a due date', function() {
			var activities = window.D2L.Hypermedia.Siren.Parse({
				entities: [incompleteActivity],
				links: [{
					rel: ['self'],
					href: '/path/to/user-assignment-activities'
				}]
			});

			return component._getActivityUsagesInfo(activities, token)
				.then(function() {
					expect(component._fetchEntity).to.have.been.calledWith(activityUsageHref);
				});
		});

		it('should make a request to _fetchEntity for the overdue link if the provided activity has a due date', function() {
			component._fetchEntity.withArgs(overdueHref, token).returns(
				window.D2L.Hypermedia.Siren.Parse({})
			);
			var activities = window.D2L.Hypermedia.Siren.Parse({
				entities: [incompleteActivity],
				links: [{
					rel: ['self'],
					href: '/path/to/user-assignment-activities'
				}, {
					rel: ['https://activities.api.brightspace.com/rels/overdue'],
					href: overdueHref
				}]
			});
			return component._getActivityUsagesInfo(activities, token)
				.then(function() {
					expect(component._fetchEntity).to.have.been.calledWith(overdueHref);
				});
		});

		it('should make a request to _fetchEntity for each activity with a due date but only 1 call for overdue activities', function() {

			component._fetchEntity.withArgs(overdueHref, token).returns(
				window.D2L.Hypermedia.Siren.Parse({})
			);

			var incompleteActivity2 = JSON.parse(JSON.stringify(incompleteActivity));
			incompleteActivity2.links.find(function(link) { return link.rel[0] === 'https://activities.api.brightspace.com/rels/activity-usage'; }).href = activityUsageHref2;

			var activities = window.D2L.Hypermedia.Siren.Parse({
				entities: [incompleteActivity, incompleteActivity2],
				links: [{
					rel: ['self'],
					href: '/path/to/user-assignment-activities'
				}, {
					rel: ['https://activities.api.brightspace.com/rels/overdue'],
					href: overdueHref
				}]
			});
			return component._getActivityUsagesInfo(activities, token)
				.then(function() {
					expect(component._fetchEntity).to.have.been.calledWith(activityUsageHref);
					expect(component._fetchEntity).to.have.been.calledWith(activityUsageHref2);
					expect(component._fetchEntity).to.have.been.calledWith(overdueHref);
					expect(component._fetchEntity).to.have.been.calledThrice;
				});
		});

		it('should set activityIsComplete to true if there is a completion entity', function() {
			var activities = window.D2L.Hypermedia.Siren.Parse({
				entities: [completeActivity],
				links: [{
					rel: ['self'],
					href: '/path/to/user-assignment-activities'
				}]
			});
			return component._getActivityUsagesInfo(activities, token)
				.then(function(activities) {
					expect(activities[0].activityIsComplete).to.equal(true);
				});
		});

		it('should set activityIsComplete to false if there is not a completion entity', function() {
			var activities = window.D2L.Hypermedia.Siren.Parse({
				entities: [incompleteActivity],
				links: [{
					rel: ['self'],
					href: '/path/to/user-assignment-activities'
				}]
			});
			return component._getActivityUsagesInfo(activities, token)
				.then(function(activities) {
					expect(activities[0].activityIsComplete).to.equal(false);
				});
		});

		it('should set activityIsOverdue to true or false depending if the activity is found in the overdue activity results', function() {

			var incompleteActivity2 = JSON.parse(JSON.stringify(incompleteActivity));
			incompleteActivity2.links.find(function(link) { return link.rel[0] === 'self'; }).href = activityUsageHref2 + '/self';
			incompleteActivity2.links.find(function(link) { return link.rel[0] === 'https://activities.api.brightspace.com/rels/activity-usage'; }).href = activityUsageHref2;

			var incompleteActivity3 = JSON.parse(JSON.stringify(incompleteActivity));
			incompleteActivity3.links.find(function(link) { return link.rel[0] === 'self'; }).href = activityUsageHref3 + '/self';
			incompleteActivity3.links.find(function(link) { return link.rel[0] === 'https://activities.api.brightspace.com/rels/activity-usage'; }).href = activityUsageHref3;

			component._fetchEntity.withArgs(overdueHref, token).returns(
				window.D2L.Hypermedia.Siren.Parse({
					entities: [incompleteActivity, incompleteActivity3],
					links: [{
						rel: ['self'],
						href: '/stuff/that/is/overdue'
					}]
				})
			);
			var activities = window.D2L.Hypermedia.Siren.Parse({
				entities: [incompleteActivity, incompleteActivity2],
				links: [{
					rel: ['self'],
					href: '/path/to/user-assignment-activities'
				}, {
					rel: ['https://activities.api.brightspace.com/rels/overdue'],
					href: overdueHref
				}]
			});
			return component._getActivityUsagesInfo(activities, token)
				.then(function(activities) {
					expect(activities[0].activityIsOverdue).to.equal(true);
					expect(activities[1].activityIsOverdue).to.equal(false);
				});
		});

		it('should set the activityUsage to the retrieved user-activity-usage entity', function() {
			var activityUsageEntity = window.D2L.Hypermedia.Siren.Parse({
				class: ['user-activity-usage']
			});

			component._fetchEntity.withArgs(activityUsageHref, token).returns(
				Promise.resolve(activityUsageEntity)
			);

			var activities = window.D2L.Hypermedia.Siren.Parse({
				entities: [incompleteActivity],
				links: [{
					rel: ['self'],
					href: '/path/to/user-assignment-activities'
				}]
			});

			return component._getActivityUsagesInfo(activities, token)
				.then(function(activities) {
					expect(activities[0].activityUsage).to.equal(activityUsageEntity);
				});
		});

		it('should set the orgUnitLink to the organization link href from the user-assignment-activity', function() {
			var activities = window.D2L.Hypermedia.Siren.Parse({
				entities: [incompleteActivity],
				links: [{
					rel: ['self'],
					href: '/path/to/user-assignment-activities'
				}]
			});

			return component._getActivityUsagesInfo(activities, token)
				.then(function(activities) {
					expect(activities[0].orgUnitLink).to.equal(organizationHref);
				});
		});
	});

	describe('_getUserActivityUsageInfo', function() {
		var assignmentName = 'this is the assignment name';
		var assignmentDueDate = '2017-07-27T18:54:00.000Z';
		var assignmentHref = '/path/to/assignment';
		var assignmentHref2 = '/path/to/assignment/2';
		var assignmentHref3 = '/path/to/assignment/3';
		var assignmentHref4 = '/path/to/assignment/4';
		var assignmentUsageHref = '/path/to/assignment/usage';
		var organizationName = 'this is the organization name';
		var organizationHref = '/path/to/org';
		var organizationHref2 = '/path/to/org/2';
		var organizationHref3 = '/path/to/org/3';

		var baseActivityUsage = {
			class: ['activity', 'assignment-activity'],
			links: [{
				rel: ['self'],
				href: assignmentUsageHref
			}, {
				rel: ['https://api.brightspace.com/rels/organization'],
				href: organizationHref
			}, {
				rel: ['https://api.brightspace.com/rels/assignment'],
				href: assignmentHref
			}]
		};

		var assignmentEntity = {
			properties: {
				name: assignmentName,
				dueDate: assignmentDueDate
			},
			links: [{
				rel: ['self'],
				href: assignmentHref
			}],
			rel: ['https://assignments.api.brightspace.com/rels/assignment']
		};

		var organizationEntity = {
			properties: {
				name: organizationName
			},
			links: [{
				rel: ['self'],
				href: organizationHref
			}]
		};

		beforeEach(function() {
			component._fetchEntity = sandbox.stub().returns(Promise.resolve({}));
		});

		it('should make no requests to _fetchEntity if no _getActivityUsagesInfo responses are provided', function() {
			var responses = [];
			return component._getUserActivityUsageInfo(responses, token)
				.then(function() {
					expect(component._fetchEntity).to.not.have.been.called;
				});
		});

		it('should make no requests to _fetchEntity if none of the provided activity usages are published', function() {
			var activityUsageEntity = window.D2L.Hypermedia.Siren.Parse(baseActivityUsage);
			var responses = [{
				activityUsage: activityUsageEntity
			}];
			return component._getUserActivityUsageInfo(responses, token)
				.then(function() {
					expect(component._fetchEntity).to.not.have.been.called;
				});
		});

		it('should make a request to _fetchEntity for the assignment link if the provided activity usage is published', function() {
			var publishedActivityUsage = JSON.parse(JSON.stringify(baseActivityUsage));
			publishedActivityUsage.class.push('published');
			var activityUsageEntity = window.D2L.Hypermedia.Siren.Parse(publishedActivityUsage);

			var responses = [{
				activityUsage: activityUsageEntity,
				orgUnitLink: organizationHref
			}];

			component._fetchEntity.withArgs(assignmentHref, token).returns(
				window.D2L.Hypermedia.Siren.Parse(assignmentEntity)
			);
			component._fetchEntity.withArgs(organizationHref, token).returns(
				window.D2L.Hypermedia.Siren.Parse(organizationEntity)
			);

			return component._getUserActivityUsageInfo(responses, token)
				.then(function() {
					expect(component._fetchEntity).to.have.been.calledWith(assignmentHref);
				});
		});

		it('should make a request to _fetchEntity for the organization link', function() {
			var publishedActivityUsage = JSON.parse(JSON.stringify(baseActivityUsage));
			publishedActivityUsage.class.push('published');
			var activityUsageEntity = window.D2L.Hypermedia.Siren.Parse(publishedActivityUsage);

			var responses = [{
				activityUsage: activityUsageEntity,
				orgUnitLink: organizationHref
			}];

			component._fetchEntity.withArgs(assignmentHref, token).returns(
				window.D2L.Hypermedia.Siren.Parse(assignmentEntity)
			);
			component._fetchEntity.withArgs(organizationHref, token).returns(
				window.D2L.Hypermedia.Siren.Parse(organizationEntity)
			);

			return component._getUserActivityUsageInfo(responses, token)
				.then(function() {
					expect(component._fetchEntity).to.have.been.calledWith(organizationHref);
				});
		});

		it('should make a request to _fetchEntity for each published assignment but only 1 call for each organization of published assignments', function() {

			// href1, unpublished, org3
			var unpublishedActivityUsage = JSON.parse(JSON.stringify(baseActivityUsage));
			var response1 = {
				activityUsage: window.D2L.Hypermedia.Siren.Parse(unpublishedActivityUsage),
				orgUnitLink: organizationHref3
			};

			// href2, published, org1
			var publishedActivityUsage = JSON.parse(JSON.stringify(baseActivityUsage));
			publishedActivityUsage.class.push('published');
			publishedActivityUsage.links.find(function(link) {
				return link.rel[0] === 'https://api.brightspace.com/rels/assignment';
			}).href = assignmentHref2;
			var response2 = {
				activityUsage: window.D2L.Hypermedia.Siren.Parse(publishedActivityUsage),
				orgUnitLink: organizationHref
			};

			// href3, published, org1
			var publishedActivityUsage2 = JSON.parse(JSON.stringify(baseActivityUsage));
			publishedActivityUsage2.class.push('published');
			publishedActivityUsage2.links.find(function(link) {
				return link.rel[0] === 'https://api.brightspace.com/rels/assignment';
			}).href = assignmentHref3;
			var response3 = {
				activityUsage: window.D2L.Hypermedia.Siren.Parse(publishedActivityUsage2),
				orgUnitLink: organizationHref
			};

			// href4, published, org2
			var publishedActivityUsage3 = JSON.parse(JSON.stringify(baseActivityUsage));
			publishedActivityUsage3.class.push('published');
			publishedActivityUsage3.links.find(function(link) {
				return link.rel[0] === 'https://api.brightspace.com/rels/assignment';
			}).href = assignmentHref4;
			var response4 = {
				activityUsage: window.D2L.Hypermedia.Siren.Parse(publishedActivityUsage3),
				orgUnitLink: organizationHref2
			};

			var responses = [response1, response2, response3, response4];

			component._fetchEntity.withArgs(assignmentHref, token).returns(
				window.D2L.Hypermedia.Siren.Parse(assignmentEntity)
			);
			component._fetchEntity.withArgs(assignmentHref2, token).returns(
				window.D2L.Hypermedia.Siren.Parse(assignmentEntity)
			);
			component._fetchEntity.withArgs(assignmentHref3, token).returns(
				window.D2L.Hypermedia.Siren.Parse(assignmentEntity)
			);
			component._fetchEntity.withArgs(assignmentHref4, token).returns(
				window.D2L.Hypermedia.Siren.Parse(assignmentEntity)
			);
			component._fetchEntity.withArgs(organizationHref, token).returns(
				window.D2L.Hypermedia.Siren.Parse(organizationEntity)
			);
			component._fetchEntity.withArgs(organizationHref2, token).returns(
				window.D2L.Hypermedia.Siren.Parse(organizationEntity)
			);

			return component._getUserActivityUsageInfo(responses, token)
				.then(function() {
					expect(component._fetchEntity).to.not.have.been.calledWith(assignmentHref);
					expect(component._fetchEntity).to.have.been.calledWith(assignmentHref2);
					expect(component._fetchEntity).to.have.been.calledWith(assignmentHref3);
					expect(component._fetchEntity).to.have.been.calledWith(assignmentHref4);
					expect(component._fetchEntity).to.have.been.calledWith(organizationHref);
					expect(component._fetchEntity).to.have.been.calledWith(organizationHref2);
					expect(component._fetchEntity).to.not.have.been.calledWith(organizationHref3);
					expect(component._fetchEntity.callCount).to.equal(5);
				});
		});

		it('should set the response name, courseName, and dueDate property values correctly', function() {
			var publishedActivityUsage = JSON.parse(JSON.stringify(baseActivityUsage));
			publishedActivityUsage.class.push('published');
			var activityUsageEntity = window.D2L.Hypermedia.Siren.Parse(publishedActivityUsage);

			var responses = [{
				activityUsage: activityUsageEntity,
				orgUnitLink: organizationHref
			}];

			component._fetchEntity.withArgs(assignmentHref, token).returns(
				window.D2L.Hypermedia.Siren.Parse(assignmentEntity)
			);
			component._fetchEntity.withArgs(organizationHref, token).returns(
				window.D2L.Hypermedia.Siren.Parse(organizationEntity)
			);

			return component._getUserActivityUsageInfo(responses, token)
				.then(function(response) {
					expect(response[0].name).to.equal(assignmentName);
					expect(response[0].courseName).to.equal(organizationName);
					expect(response[0].dueDate).to.equal(assignmentDueDate);
				});
		});
		it('should set the response instructions value to the assignment instructionsText if provided', function() {
			var publishedActivityUsage = JSON.parse(JSON.stringify(baseActivityUsage));
			publishedActivityUsage.class.push('published');
			var activityUsageEntity = window.D2L.Hypermedia.Siren.Parse(publishedActivityUsage);

			var responses = [{
				activityUsage: activityUsageEntity,
				orgUnitLink: organizationHref
			}];

			var instructionsText = 'this is the instructions text';
			var assignmentEntityWithInstructions = JSON.parse(JSON.stringify(assignmentEntity));
			assignmentEntityWithInstructions.properties.instructionsText = instructionsText;
			assignmentEntityWithInstructions.properties.instructions = 'some other text';

			component._fetchEntity.withArgs(assignmentHref, token).returns(
				window.D2L.Hypermedia.Siren.Parse(assignmentEntityWithInstructions)
			);
			component._fetchEntity.withArgs(organizationHref, token).returns(
				window.D2L.Hypermedia.Siren.Parse(organizationEntity)
			);

			return component._getUserActivityUsageInfo(responses, token)
				.then(function(response) {
					expect(response[0].instructions).to.equal(instructionsText);
				});
		});
		it('should set the response instructions value to the assignment instructions if instructionsText is not provided', function() {
			var publishedActivityUsage = JSON.parse(JSON.stringify(baseActivityUsage));
			publishedActivityUsage.class.push('published');
			var activityUsageEntity = window.D2L.Hypermedia.Siren.Parse(publishedActivityUsage);

			var responses = [{
				activityUsage: activityUsageEntity,
				orgUnitLink: organizationHref
			}];

			var instructions = 'these are the instructions';
			var assignmentEntityWithInstructions = JSON.parse(JSON.stringify(assignmentEntity));
			assignmentEntityWithInstructions.properties.instructions = instructions;

			component._fetchEntity.withArgs(assignmentHref, token).returns(
				window.D2L.Hypermedia.Siren.Parse(assignmentEntityWithInstructions)
			);
			component._fetchEntity.withArgs(organizationHref, token).returns(
				window.D2L.Hypermedia.Siren.Parse(organizationEntity)
			);

			return component._getUserActivityUsageInfo(responses, token)
				.then(function(response) {
					expect(response[0].instructions).to.equal(instructions);
				});
		});
		// TODO: data driven vars here
		[
			{ isComplete: false, isOverdue: false },
			{ isComplete: true, isOverdue: false },
			{ isComplete: false, isOverdue: true },
			{ isComplete: true, isOverdue: true }
		].forEach(function(testcase) {
			it('should set the response isComplete and isOverdue values to the _getActivityUsagesInfo response values provided (isComplete ' + testcase.isComplete + ', isOverdue ' + testcase.isOverdue + ')', function() {
				var publishedActivityUsage = JSON.parse(JSON.stringify(baseActivityUsage));
				publishedActivityUsage.class.push('published');
				var activityUsageEntity = window.D2L.Hypermedia.Siren.Parse(publishedActivityUsage);

				var responses = [{
					activityUsage: activityUsageEntity,
					orgUnitLink: organizationHref,
					activityIsComplete: testcase.isComplete,
					activityIsOverdue: testcase.isOverdue
				}];

				component._fetchEntity.withArgs(assignmentHref, token).returns(
					window.D2L.Hypermedia.Siren.Parse(assignmentEntity)
				);
				component._fetchEntity.withArgs(organizationHref, token).returns(
					window.D2L.Hypermedia.Siren.Parse(organizationEntity)
				);

				return component._getUserActivityUsageInfo(responses, token)
					.then(function(response) {
						expect(response[0].isCompleted).to.equal(testcase.isComplete);
						expect(response[0].isOverdue).to.equal(testcase.isOverdue);
					});
			});
		});

		[
			{ isComplete: false, isOverdue: false, daysDiff: 0, expected: true },
			{ isComplete: true, isOverdue: false, daysDiff: 0, expected: false },
			{ isComplete: false, isOverdue: true, daysDiff: 0, expected: false },
			{ isComplete: true, isOverdue: true, daysDiff: 0, expected: false },
			{ isComplete: false, isOverdue: false, daysDiff: 1, expected: false },
			{ isComplete: true, isOverdue: false, daysDiff: 1, expected: false },
			{ isComplete: false, isOverdue: true, daysDiff: 1, expected: false },
			{ isComplete: true, isOverdue: true, daysDiff: 1, expected: false }
		].forEach(function(testcase) {
			it('should set the isDueToday value to ' + testcase.expected + ' if the assignment due date is ' + testcase.daysDiff + ' days apart from the current day, when the activity isComplete ' + testcase.isComplete + ' and isOverdue ' + testcase.isOverdue, function() {
				var publishedActivityUsage = JSON.parse(JSON.stringify(baseActivityUsage));
				publishedActivityUsage.class.push('published');
				var activityUsageEntity = window.D2L.Hypermedia.Siren.Parse(publishedActivityUsage);

				var responses = [{
					activityUsage: activityUsageEntity,
					orgUnitLink: organizationHref,
					activityIsComplete: testcase.isComplete,
					activityIsOverdue: testcase.isOverdue
				}];

				component.getDateDiffInCalendarDays = sandbox.stub().returns(testcase.daysDiff);

				component._fetchEntity.withArgs(assignmentHref, token).returns(
					window.D2L.Hypermedia.Siren.Parse(assignmentEntity)
				);
				component._fetchEntity.withArgs(organizationHref, token).returns(
					window.D2L.Hypermedia.Siren.Parse(organizationEntity)
				);

				return component._getUserActivityUsageInfo(responses, token)
					.then(function(response) {
						expect(response[0].isDueToday).to.equal(testcase.expected);
					});
			});
		});
	});
});

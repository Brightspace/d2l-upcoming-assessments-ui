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
});

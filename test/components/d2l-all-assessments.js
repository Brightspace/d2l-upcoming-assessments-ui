/* global describe, it, fixture, expect, beforeEach, afterEach, sinon */

'use strict';

describe('<d2l-all-assessments>', function() {

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
			expect(element.is).to.equal('d2l-all-assessments');
		});

	});

	describe('fetching data', function() {

		var element;
		var sandbox;

		beforeEach(function() {
			sandbox = sinon.sandbox.create();

			element = fixture('basic');
			element._debounceTime = 10;
		});

		afterEach(function() {
			sandbox.restore();
		});

		describe('_onDateValueChanged', function() {
			it('invokes _loadActivitiesForPeriod with the activities entity', function() {
				element._loadActivitiesForPeriod = sandbox.stub().returns(Promise.resolve());
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

				element.__activitiesEntity = activitiesEntity;

				var dateObj = {
					detail: {
						date: new Date('Tue Sep 05 2017 00:00:00Z')
					}
				};

				return element._onDateValueChanged(dateObj)
					.then(function() {
						expect(element._loadActivitiesForPeriod).to.have.been.calledWith(activitiesEntity);
					});
			});
		});

	});

});

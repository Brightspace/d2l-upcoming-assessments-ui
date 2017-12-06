/* global describe, it, fixture, expect, beforeEach, afterEach, sinon */

'use strict';

describe('<d2l-upcoming-assessments>', function() {

	var element;

	beforeEach(function() {
		element = fixture('basic');
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
			it('invokes _loadActivitiesForPeriod with the correct url', function() {
				element._loadActivitiesForPeriod = sandbox.stub().returns(Promise.resolve());
				element._selectCustomDateRangeAction = {
					href: 'http://www.foo.com',
					fields: [{
						name:'start',
						type:'text',
						value:'2017-09-26T19:14:21.889Z'
					}, {
						name:'end',
						type:'text',
						value:'2017-10-03T19:14:21.889Z'
					}]
				};
				var date = new Date('Tue Sep 05 2017 00:00:00');
				var dateObj = {
					detail: {
						date: date
					}
				};

				var expected = {
					'start': 'Sept 3 2017 00:00:00',
					'end': 'Sept 16 2017 23:59:59'
				};

				var start = new Date(expected.start).toISOString();
				var endDate = new Date(expected.end);
				endDate.setMilliseconds(999);
				var end = endDate.toISOString();

				var expectedUrl = 'http://www.foo.com?start=' + start + '&end=' + end;
				return element._onDateValueChanged(dateObj)
					.then(function() {
						expect(element._loadActivitiesForPeriod).to.have.been.calledWith(expectedUrl);
					});
			});
		});

	});

});

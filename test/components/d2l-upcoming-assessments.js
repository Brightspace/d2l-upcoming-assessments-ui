/* global describe, it, fixture, expect, beforeEach, afterEach, sinon */

'use strict';

describe('<d2l-upcoming-assessments>', function() {

	var element;
	var periodUrl = '/some/period/now/';
	var activities = {
		properties: {
			start: '2017-07-19T16:20:07.567Z',
			end: '2017-08-02T16:20:07.567Z'
		}
	};

	beforeEach(function() {
		element = fixture('basic');
	});

	describe('smoke test', function() {

		it('can be instantiated', function() {
			expect(element.is).to.equal('d2l-upcoming-assessments');
		});

	});

	describe('fetching data', function() {

		var element;
		var sandbox;
		var server;

		beforeEach(function() {
			sandbox = sinon.sandbox.create();
			server = sinon.fakeServer.create();
			server.respondImmediately = true;

			element = fixture('basic');
			element._debounceTime = 10;
		});

		afterEach(function() {
			server.restore();
			sandbox.restore();
		});

		// TODO: This test needs to become a series of more relevant tests now that the fetching is more complex
		// it('doesn\'t display an error message when request for data is successful', function(done) {
		// 	var spy = sinon.spy(element, '_onAssessmentsResponse');

		// 	element.userUrl = '/some/path/';
		// 	element.token = 'foozleberries';

		// 	server.respondWith(
		// 		'GET',
		// 		fixture('basic').endpoint,
		// 		[200, {'content-type': 'application/json'}, '[]']
		// 	);

		// 	setTimeout(function() {
		// 		expect(spy.callCount).to.equal(1);
		// 		expect(element.$$('.error-message')).to.not.exist;
		// 		done();
		// 	}, 20);
		// });

		// it('displays an error message when request for data fails', function(done) {
		// 	element.userUrl = '/some/path/';
		// 	element.token = 'foozleberries';

		// 	server.respondWith(
		// 		'GET',
		// 		fixture('basic').endpoint,
		// 		[404, {}, '']
		// 	);

		// 	setTimeout(function() {
		// 		expect(element._showError).to.equal(true);
		// 		expect(element.$$('.error-message')).to.exist;
		// 		done();
		// 	}, 20);
		// });

		describe('_getCustomDateRangeParameters', function() {
			it('gets the correct range when selected date is a Tuesday', function() {
				var date = new Date('Tue Sep 12 2017 00:00:00 GMT-0400 (EDT)');
				var expected = {
					start: '2017-09-10T04:00:00.000Z',
					end: '2017-09-24T03:59:59.999Z'
				};
				var range = element._getCustomDateRangeParameters(date);
				expect(range).to.deep.equal(expected);
			});

			it('gets the correct range when selected date is a Sunday', function() {
				var date = new Date('Sun Sep 03 2017 00:00:00 GMT-0400 (EDT)');
				var expected = {
					'start':'2017-09-03T04:00:00.000Z',
					'end':'2017-09-17T03:59:59.999Z'
				};
				var range = element._getCustomDateRangeParameters(date);
				expect(range).to.deep.equal(expected);
			});

			it('gets the correct range when selected date is a Saturday', function() {
				var date = new Date('Sat Aug 26 2017 00:00:00 GMT-0400 (EDT)');
				var expected = {
					'start':'2017-08-20T04:00:00.000Z',
					'end':'2017-09-03T03:59:59.999Z'
				};
				var range = element._getCustomDateRangeParameters(date);
				expect(range).to.deep.equal(expected);
			});
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
				var date = new Date('Tue Sep 05 2017 00:00:00 GMT-0400 (EDT)');
				var dateObj = {
					detail: {
						date: date
					}
				};

				var expectedUrl = 'http://www.foo.com?start=2017-09-03T04:00:00.000Z&end=2017-09-17T03:59:59.999Z';
				return element._onDateValueChanged(dateObj)
					.then(function() {
						expect(element._loadActivitiesForPeriod).to.have.been.calledWith(expectedUrl);
					});
			});
		});

		describe('_loadActivitiesForPeriod', function() {

			it('does nothing if the provided url was not set', function() {
				element._fetchEntity = sandbox.stub();
				return element._loadActivitiesForPeriod()
					.then(function() {
						return Promise.reject('Expected _loadActivitiesForPeriod to reject');
					})
					.catch(function() {
						expect(element._fetchEntity).to.not.have.been.called;
					});
			});

			it('calls _fetchEntity for the provided url', function() {
				element._fetchEntity = sandbox.stub().returns(Promise.resolve(
					window.D2L.Hypermedia.Siren.Parse(activities)
				));
				return element._loadActivitiesForPeriod(periodUrl)
					.then(function() {
						expect(element._fetchEntity).to.have.been.calledWith(periodUrl);
					});
			});

		});

		describe('_getCustomRangeAction', function() {
			it('does nothing if the provided url was not set', function() {
				element._fetchEntity = sandbox.stub();
				return element._getCustomRangeAction()
					.then(function() {
						return Promise.reject('Expected _getCustomRangeAction to reject');
					})
					.catch(function() {
						expect(element._fetchEntity).to.not.have.been.called;
					});
			});

			it('calls _fetchEntity for the provided url', function() {
				element._fetchEntity = sandbox.stub().returns(Promise.resolve(
					window.D2L.Hypermedia.Siren.Parse(activities)
				));
				return element._getCustomRangeAction(periodUrl)
					.then(function() {
						expect(element._fetchEntity).to.have.been.calledWith(periodUrl);
					});
			});
		});

	});

});

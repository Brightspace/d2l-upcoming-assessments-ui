/* global describe, it, fixture, expect, beforeEach, afterEach, sinon */

'use strict';

describe('<d2l-upcoming-assessments>', function() {

	var element;
	var nextPeriodUrl = '/some/period/beyond/now/';
	var previousPeriodUrl = '/some/period/before/now/';
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

		describe('_goNext', function() {
			it('invokes _loadActivitiesForPeriod with the nextPeriodUrl', function() {
				element._loadActivitiesForPeriod = sandbox.stub().returns(Promise.resolve());
				element._nextPeriodUrl = nextPeriodUrl;
				return element._goNext()
					.then(function() {
						expect(element._loadActivitiesForPeriod).to.have.been.calledWith(nextPeriodUrl);
					});
			});
		});

		describe('_goPrev', function() {
			it('invokes _loadActivitiesForPeriod with the previousPeriodUrl', function() {
				element._loadActivitiesForPeriod = sandbox.stub().returns(Promise.resolve());
				element._previousPeriodUrl = previousPeriodUrl;
				return element._goPrev()
					.then(function() {
						expect(element._loadActivitiesForPeriod).to.have.been.calledWith(previousPeriodUrl);
					});
			});
		});

		describe('_loadActivitiesForPeriod', function() {

			it('does nothing if the provided url was not set', function() {
				element._fetchEntity = sandbox.stub();
				return element._loadActivitiesForPeriod()
					.then(function() {
						expect(element._fetchEntity).to.not.have.been.called;
					});
			});

			it('calls _fetchEntity for the provided url', function() {
				element._fetchEntity = sandbox.stub().returns(Promise.resolve(activities));
				return element._loadActivitiesForPeriod(nextPeriodUrl)
					.then(function() {
						expect(element._fetchEntity).to.have.been.calledWith(nextPeriodUrl);
					});
			});

		});

		describe('_getCustomRangeAction', function() {
			it('does nothing if the provided url was not set', function() {
				element._fetchEntity = sandbox.stub();
				return element._getCustomRangeAction()
					.then(function() {
						expect(element._fetchEntity).to.not.have.been.called;
					});
			});

			it('calls _fetchEntity for the provided url', function() {
				element._fetchEntity = sandbox.stub().returns(Promise.resolve(
					window.D2L.Hypermedia.Siren.Parse(activities)
				));
				return element._getCustomRangeAction(nextPeriodUrl)
					.then(function() {
						expect(element._fetchEntity).to.have.been.calledWith(nextPeriodUrl);
					});
			});
		});

	});

});

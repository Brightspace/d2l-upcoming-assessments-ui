/* global describe, it, fixture, expect, beforeEach, afterEach, sinon */

'use strict';

describe('<d2l-upcoming-assessments>', function() {

	var element;

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

		/*
		it.skip('displays an error message when request for data fails', function(done) {
			element.userUrl = '/some/path/';
			element.token = 'foozleberries';

			server.respondWith(
				'GET',
				fixture('basic').endpoint,
				[404, {}, '']
			);

			setTimeout(function() {
				expect(element._showError).to.equal(true);
				expect(element.$$('.error-message')).to.exist;
				done();
			}, 20);
		});
		*/

	});

});

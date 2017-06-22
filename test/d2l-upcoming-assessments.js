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

		var server;
		var clock;

		beforeEach(function() {
			server = sinon.fakeServer.create();
			server.respondImmediately = true;
			clock = sinon.useFakeTimers();
		});

		afterEach(function() {
			server.restore();
			clock.restore();
		});

		it('doesn\'t display an error message when request for data is successful', function() {
			server.respondWith(
				'GET',
				fixture('valid-endpoint').endpoint,
				[200, {'content-type': 'application/json'}, '[]']
			);

			element = fixture('valid-endpoint');

			clock.tick(500);

			setTimeout(function(done) {
				expect(element.$$('.error-message')).to.not.exist;
				done();
			});
		});

		it('displays an error message when request for data fails', function() {
			server.respondWith(
				'GET',
				fixture('valid-endpoint').endpoint,
				[404, {}, '']
			);

			element = fixture('valid-endpoint');

			clock.tick(500);

			setTimeout(function(done) {
				expect(element.$$('.error-message')).to.exist;
				done();
			});

		});

	});

});

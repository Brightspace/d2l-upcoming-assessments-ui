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

			element = fixture('valid-endpoint');
		});

		afterEach(function() {
			server.restore();
			sandbox.restore();
		});

		it('doesn\'t display an error message when request for data is successful', function(done) {
			server.respondWith(
				'GET',
				fixture('valid-endpoint').endpoint,
				[200, {'content-type': 'application/json'}, '[]']
			);

			var spy = sinon.spy(element, '_onAssessmentsResponse');

			setTimeout(function() {
				expect(spy.callCount).to.equal(1);
				expect(element.$$('.error-message')).to.not.exist;
				done();
			}, 20);
		});

		it('displays an error message when request for data fails', function(done) {
			server.respondWith(
				'GET',
				fixture('valid-endpoint').endpoint,
				[404, {}, '']
			);

			var spy = sinon.spy(element, '_onError');

			setTimeout(function() {
				expect(spy.callCount).to.equal(1);
				expect(element.$$('.error-message')).to.exist;
				done();
			}, 20);
		});

	});

});

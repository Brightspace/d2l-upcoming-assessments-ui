/* global describe, it, fixture, expect, beforeEach */

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

		it('doesn\'t display an error message when request for data is successful', function() {
			element._onResponse({
				detail: {
					status: 200,
					xhr: {
						response: []
					}
				}
			});

			element.$$('template').render();

			expect(element.$$('.error-message')).to.not.exist;
		});

		it('displays an error message when request for data fails', function() {
			element._onResponse({
				detail: {
					status: 404
				}
			});

			element.$$('template').render();

			expect(element.$$('.error-message')).to.exist;
		});

	});

});

/* global describe, it, fixture, expect, beforeEach */

'use strict';

describe('localize-behavior', function() {

	var element;

	beforeEach(function() {
		element = fixture('basic');
	});

	describe('smoke tests', function() {

		it('can localize text correctly', function() {
			var result = element.localize('upcomingAssessments');
			expect(result).to.equal('Upcoming Assessments');
		});

	});

});

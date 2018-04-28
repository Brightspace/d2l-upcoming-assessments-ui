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

		describe('_getUpcomingAssessments', function() {

			it('should set the assessments', function() {
				element.isActivityUpcoming = sandbox.stub().returns(true);
				element._getInfo = sandbox.stub().returns(Promise.resolve());

				element._getUpcomingAssessments([1, 2, 3]);
				expect(element._assessments.toString()).to.equal([1, 2, 3].toString());
			});

			it('should set the assessments count', function() {
				element.isActivityUpcoming = sandbox.stub().returns(true);

				element._getUpcomingAssessments([1, 2, 3]);
				expect(element.totalCount).to.equal(3);
			});

			it('should truncate the assessments at 3', function() {
				element.isActivityUpcoming = sandbox.stub().returns(true);

				element._getUpcomingAssessments([1, 2, 3, 4, 5, 6]);
				expect(element._assessments.toString()).to.equal([1, 2, 3].toString());
			});

			it('should not display exempted assessments', function() {
				element.isActivityUpcoming = sandbox.stub().returns(true);

				element._getUpcomingAssessments([
					{
						name: 1,
						isExempt: false
					}, {
						name: 2,
						isExempt: true
					}
				]);
				expect(element._assessments.toString()).to.equal([
					{
						name: 1,
						isExempt: false
					}
				].toString());
			});
		});

	});

});

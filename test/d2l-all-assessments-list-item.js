/* global describe, it, fixture, expect */

'use strict';

describe('<d2l-all-assessments-list-item>', function() {

	var assessmentItem = {
		'name': 'Math Quiz',
		'courseName': 'Math',
		'instructionsText': 'Do the math quiz pls, k thx.',
		'itemType': 'Quiz',
		'dueDate': '2017-04-06'
	};

	var completedAssessmentItem = {
		'name': 'Math Quiz',
		'courseName': 'Math',
		'instructionsText': 'Do the math quiz pls, k thx.',
		'itemType': 'Quiz',
		'dueDate': '2017-04-06',
		'isCompleted': true
	};

	describe('smoke test', function() {

		it('can be instantiated', function() {
			var element = fixture('basic');
			expect(element.is).to.equal('d2l-all-assessments-list-item');
		});

	});

	describe('item rendering', function() {
		it('has a completion indicator when completed', function() {
			var element = fixture('basic');

			element.set('assessmentItem', completedAssessmentItem);
			Polymer.dom.flush();

			expect(element.$$('.completion-info')).to.exist;
			expect(element.$$('.completion-info').getAttribute('hidden')).to.be.null;
		});

		it('doesn\'t have a completion indicator when not completed', function() {
			var element = fixture('basic');

			element.set('assessmentItem', assessmentItem);
			Polymer.dom.flush();

			expect(element.$$('.completion-info').getAttribute('hidden')).to.not.be.null;
		});

	});

});

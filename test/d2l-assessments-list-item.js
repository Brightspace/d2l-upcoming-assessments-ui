/* global describe, it, fixture, expect */

'use strict';

describe('<d2l-assessments-list-item>', function() {

	var assessmentItem = {
		'name': 'Math Quiz',
		'courseName': 'Math',
		'instructions': 'Do the math quiz pls, k thx.',
		'itemType': 'Quiz',
		'dueDate': '2017-04-06'
	};

	var completedAssessmentItem = {
		'name': 'Math Quiz',
		'courseName': 'Math',
		'instructions': 'Do the math quiz pls, k thx.',
		'itemType': 'Quiz',
		'dueDate': '2017-04-06',
		'isCompleted': true
	};

	describe('smoke test', function() {

		it('can be instantiated', function() {
			var element = fixture('basic');
			expect(element.is).to.equal('d2l-assessments-list-item');
		});

	});

	describe('item rendering', function() {

		it('renders the correct data', function() {
			var element = fixture('basic');

			element.set('assessmentItem', assessmentItem);

			expect(element.$$('.assessment-title').textContent).to.equal(assessmentItem.name);
			expect(element.$$('.course-name').textContent).to.equal(assessmentItem.courseName);
		});

		it('has a completion checkmark when completed', function() {
			var element = fixture('basic');

			element.set('assessmentItem', completedAssessmentItem);
			element.$$('template').render();

			expect(element.$$('.completion-icon')).to.exist;
		});

		it('doesn\'t have a completion checkmark when not completed', function() {
			var element = fixture('basic');

			element.set('assessmentItem', assessmentItem);
			element.$$('template').render();

			expect(element.$$('.completion-icon')).to.not.exist;
		});

	});

});

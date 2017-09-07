/* global describe, it, fixture, expect */

'use strict';

describe('<d2l-assessments-list-item>', function() {

	var quizItem = {
		'name': 'Math Quiz',
		'courseName': 'Math',
		'instructionsText': 'Do the math quiz pls, k thx.',
		'itemType': 'Quiz',
		'type': 'quiz',
		'dueDate': '2017-04-06'
	};

	var assignmentItem = {
		'name': 'Math Assignment',
		'courseName': 'Math',
		'instructionsText': 'Do the math assignment pls, k thx.',
		'itemType': 'Assignment',
		'type': 'assignment',
		'dueDate': '2017-04-06'
	};

	var completedAssessmentItem = {
		'name': 'Math Quiz',
		'courseName': 'Math',
		'instructionsText': 'Do the math quiz pls, k thx.',
		'itemType': 'Quiz',
		'type': 'quiz',
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

		it('renders the correct data for a quiz', function() {
			var element = fixture('basic');

			element.set('assessmentItem', quizItem);

			expect(element.$$('.assessment-title').textContent).to.equal(quizItem.name);
			expect(element.$$('.course-name').textContent).to.equal(quizItem.courseName);
			expect(element.$$('.assessment-type').textContent).to.equal(quizItem.itemType);
			expect(element.$$('.activity-icon').icon).to.equal('d2l-tier2:quizzing');
		});

		it('renders the correct data for an assignment', function() {
			var element = fixture('basic');

			element.set('assessmentItem', assignmentItem);

			expect(element.$$('.assessment-title').textContent).to.equal(assignmentItem.name);
			expect(element.$$('.course-name').textContent).to.equal(assignmentItem.courseName);
			expect(element.$$('.assessment-type').textContent).to.equal(assignmentItem.itemType);
			expect(element.$$('.activity-icon').icon).to.equal('d2l-tier2:assignments');
		});

		it('has a completion checkmark when completed', function() {
			var element = fixture('basic');

			element.set('assessmentItem', completedAssessmentItem);
			element.$$('template').render();

			expect(element.$$('.completion-icon')).to.exist;
		});

		it('doesn\'t have a completion checkmark when not completed', function() {
			var element = fixture('basic');

			element.set('assessmentItem', quizItem);
			element.$$('template').render();

			expect(element.$$('.completion-icon')).to.not.exist;
		});

	});

});

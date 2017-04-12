/* global describe, it, fixture, expect, beforeEach */

'use strict';

describe('<d2l-assessments-list>', function() {

	var element;

	var assessmentItems = [{
		'title': 'Math Assignment',
		'courseName': 'Math',
		'itemType': 'Assignment',
		'dueDate': '2017-04-05',
		'isCompleted': true
	}, {
		'title': 'Math Quiz',
		'courseName': 'Math',
		'itemType': 'Quiz',
		'dueDate': '2017-04-06'
	}, {
		'title': 'Science Quiz',
		'courseName': 'Science',
		'itemType': 'Quiz',
		'dueDate': '2017-04-08',
		'isCompleted': true
	}, {
		'title': 'History Assignment',
		'courseName': 'History',
		'itemType': 'Assignment',
		'dueDate': '2017-04-08',
		'isCompleted': true
	}];

	var newAssessmentItems = [{
		'title': 'Math Assignment',
		'courseName': 'Math',
		'itemType': 'Assignment',
		'dueDate': '2017-04-05',
		'isCompleted': true
	}, {
		'title': 'Math Quiz',
		'courseName': 'Math',
		'itemType': 'Quiz',
		'dueDate': '2017-04-06'
	}];

	beforeEach(function() {
		element = fixture('basic');
	});

	describe('smoke test', function() {

		it('can be instantiated', function() {
			expect(element.is).to.equal('d2l-assessments-list');
		});

	});

	describe('list rendering', function() {

		it('renders the correct number of list items', function() {
			element.set('assessmentItems', assessmentItems);
			element.$$('template').render();

			var listElements = Polymer.dom(element.root).querySelectorAll('d2l-assessments-list-item');

			expect(listElements.length).to.equal(assessmentItems.length);
		});

		it('re-renders the list when a new set of items is supplied', function() {
			element.set('assessmentItems', assessmentItems);
			element.$$('template').render();

			element.set('assessmentItems', newAssessmentItems);
			element.$$('template').render();

			var listElements = Polymer.dom(element.root).querySelectorAll('d2l-assessments-list-item');

			expect(listElements.length).to.equal(newAssessmentItems.length);
		});

	});

});

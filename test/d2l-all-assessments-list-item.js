/* global describe, it, fixture, expect, beforeEach */

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

		beforeEach(function() {
			assessmentItem.isDueToday = false;
			assessmentItem.isOverdue = false;
			completedAssessmentItem.isDueToday = false;
			completedAssessmentItem.isOverdue = false;
		});

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

		it('has a due today indicator when isDueToday is true', function() {
			var element = fixture('basic');

			assessmentItem.isDueToday = true;

			element.set('assessmentItem', assessmentItem);
			Polymer.dom.flush();

			expect(element.$$('.due-today-info')).to.exist;
			expect(element.$$('.due-today-info').getAttribute('hidden')).to.be.null;
		});

		it('does not have a due today indicator when isDueToday is false', function() {
			var element = fixture('basic');

			element.set('assessmentItem', completedAssessmentItem);
			Polymer.dom.flush();

			expect(element.$$('.due-today-info').getAttribute('hidden')).to.not.be.null;
		});

		it('has an overdue indicator when isOverdue is true', function() {
			var element = fixture('basic');

			assessmentItem.isOverdue = true;

			element.set('assessmentItem', assessmentItem);
			Polymer.dom.flush();

			expect(element.$$('.overdue-info')).to.exist;
			expect(element.$$('.overdue-info').getAttribute('hidden')).to.be.null;
		});

		it('does not have an overdue indicator when isOverdue is false', function() {
			var element = fixture('basic');

			element.set('assessmentItem', completedAssessmentItem);
			Polymer.dom.flush();

			expect(element.$$('.overdue-info').getAttribute('hidden')).to.not.be.null;
		});
	});

});

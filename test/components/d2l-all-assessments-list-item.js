/* global describe, it, fixture, expect, beforeEach */

'use strict';

describe('<d2l-all-assessments-list-item>', function() {
	var element;

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

	beforeEach(function() {
		element = fixture('basic');
	});

	describe('smoke test', function() {

		it('can be instantiated', function() {
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
			element.set('assessmentItem', completedAssessmentItem);
			Polymer.dom.flush();

			expect(element.$$('.completion-info')).to.exist;
			expect(element.$$('.completion-info').getAttribute('hidden')).to.be.null;
		});

		it('doesn\'t have a completion indicator when not completed', function() {
			element.set('assessmentItem', assessmentItem);
			Polymer.dom.flush();

			expect(element.$$('.completion-info').getAttribute('hidden')).to.not.be.null;
		});

		it('has a due today indicator when isDueToday is true', function() {
			assessmentItem.isDueToday = true;

			element.set('assessmentItem', assessmentItem);
			Polymer.dom.flush();

			expect(element.$$('.due-today-info')).to.exist;
			expect(element.$$('.due-today-info').getAttribute('hidden')).to.be.null;
		});

		it('does not have a due today indicator when isDueToday is false', function() {
			element.set('assessmentItem', completedAssessmentItem);
			Polymer.dom.flush();

			expect(element.$$('.due-today-info').getAttribute('hidden')).to.not.be.null;
		});

		it('has an overdue indicator when isOverdue is true', function() {
			assessmentItem.isOverdue = true;

			element.set('assessmentItem', assessmentItem);
			Polymer.dom.flush();

			expect(element.$$('.overdue-info').parentElement).to.exist;
			expect(element.$$('.overdue-info').parentElement.getAttribute('hidden')).to.be.null;
		});

		it('does not have an overdue indicator when isOverdue is false', function() {
			element.set('assessmentItem', completedAssessmentItem);
			Polymer.dom.flush();

			expect(element.$$('.overdue-info').parentElement.getAttribute('hidden')).to.not.be.null;
		});
	});

	function nowish(modifierDays) {
		var date = new Date();
		date.setDate(date.getDate() + modifierDays);
		return date;
	}

	describe('getRelativeDateString', function() {
		[
			{ date: nowish(0), dateStr: 'today', result: /^Today$/ },
			{ date: nowish(1), dateStr: 'tomorrow', result: /^Tomorrow$/ },
			{ date: nowish(5), dateStr: 'date within the week', result: /^.*(Sun|Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day.*$/ },
			// The seemingly-extra characters are to fix weird behavior with Sauce and Microsoft Edge
			{ date: nowish(10), dateStr: 'future date', result: /^.*(Sun|Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day.*, .*[A-Z].* .*\d{1,2}$/ },
			{ date: nowish(-1), dateStr: 'yesterday', result: /^.*(Sun|Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day.*, .*[A-Z].* .*\d{1,2}$/ },
			{ date: nowish(-10), dateStr: 'past date', result: /^.*(Sun|Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day.*, .*[A-Z].* .*\d{1,2}$/ }
		].forEach(function(testCase) {
			it('returns correct date string for ' + testCase.dateStr, function() {
				var relativeDateString = element._getRelativeDateString(testCase.date);
				expect(relativeDateString).to.match(testCase.result);
			});
		});
	});

});

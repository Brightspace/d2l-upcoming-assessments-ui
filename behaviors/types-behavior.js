import { Classes, Rels } from 'd2l-hypermedia-constants';
import './status-badge-behavior.js';

window.D2L = window.D2L || {};
window.D2L.UpcomingAssessments = window.D2L.UpcomingAssessments || {};

/*
* @polymerBehavior window.D2L.UpcomingAssessments.TypesBehavior
*/
var typesBehaviorImpl = {
	properties: {
		_types: {
			type: Object,
			value: function() {
				return {
					assignment: {
						icon: 'assignments',
						assessmentType: 'assignment',
						canOpen: true,
						instructionsRel: Rels.Assignments.instructions,
						userActivityUsageClass: Classes.activities.userAssignmentActivity,
						activityRel: Rels.assignment,
						activityClass: Classes.assignments.assignment,
						noCompletion: false,
						activityDetailsFeatureFlag: 'assignmentDetailsEnabled'
					},
					checklistItem: {
						icon: function() {
							return 'd2l-tier2:checklist'; // checklist doesn't have a tier3 icon
						},
						assessmentType: 'checklistItem',
						canOpen: false,
						instructionsRel: Rels.Checklists.description,
						userActivityUsageClass: Classes.activities.userChecklistActivity,
						activityRel: Rels.Checklists.checklistItem,
						activityClass: 'checklist-item',
						noCompletion: false,
						activityDetailsFeatureFlag: 'NOT_IMPLEMENTED'
					},
					content: {
						icon: function(assessmentItem) {
							// content icons always tier 2
							if (assessmentItem.tier2IconKey) {
								return assessmentItem.tier2IconKey;
							}
							return 'd2l-tier2:content';
						},
						assessmentType: 'content',
						canOpen: false,
						instructionsRel: this.HypermediaRels.Content.description,
						userActivityUsageClass: Classes.activities.userContentActivity,
						usagePredicate: function(userActivityUsage) {
							return userActivityUsage && userActivityUsage.hasClass(Classes.content.topic);
						}.bind(this),
						activityRel: this.HypermediaRels.content,
						activityClass: Classes.content.sequencedActivity,
						noCompletion: false,
						activityDetailsFeatureFlag: 'NOT_IMPLEMENTED'
					},
					discussion: {
						icon: 'discussions',
						assessmentType: 'discussion',
						canOpen: true,
						instructionsRel: Rels.Discussions.description,
						userActivityUsageClass: Classes.activities.userDiscussionActivity,
						activityRel: Rels.Discussions.topic,
						activityClass: Classes.discussions.topic,
						noCompletion: true,
						activityDetailsFeatureFlag: 'discussionDetailsEnabled'
					},
					quiz: {
						icon: 'quizzing',
						assessmentType: 'quiz',
						canOpen: false,
						instructionsRel: Rels.Quizzes.description,
						userActivityUsageClass: Classes.activities.userQuizActivity,
						activityRel: Rels.quiz,
						activityClass: Classes.quizzes.quiz,
						noCompletion: false,
						activityDetailsFeatureFlag: 'NOT_IMPLEMENTED'
					},
					survey: {
						icon: function() {

						},
						assessmentType: 'survey',
						canOpen: false,
						userActivityUsageClass: Classes.activities.userSurveyActivity,
						activityRel: Rels.Surveys.survey,
						activityClass: 'survey',
						noCompletion: false,
						instructionsRel: Rels.Surveys.description,
						activityDetailsFeatureFlag: 'NOT_IMPLEMENTED'
					}
				};
			}
		}
	},

	_allTypes: ['assignment', 'discussion', 'quiz', 'content', 'survey', 'checklistItem'],

	_getActivityType: function(activity) {
		for (var i = 0; i < this._allTypes.length; i++) {
			var typeName = this._allTypes[i];
			var type = this._types[typeName];
			if (activity.hasClass(type.activityClass)) {
				return typeName;
			}
		}
		return undefined;
	},

	_canOpenItemType: function(assessmentItem, flags) {
		var item = this._types[(assessmentItem || {}).type] || {};
		return item.canOpen && (!item.activityDetailsFeatureFlag || !!flags[item.activityDetailsFeatureFlag]);
	}
};

window.D2L.UpcomingAssessments.TypesBehavior = [
	window.D2L.UpcomingAssessments.StatusBadgeBehavior,
	typesBehaviorImpl
];

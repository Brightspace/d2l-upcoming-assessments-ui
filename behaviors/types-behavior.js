import 'd2l-hypermedia-constants/d2l-hm-constants-behavior.js';
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
						instructionsRel: this.HypermediaRels.Assignments.instructions,
						userActivityUsageClass: this.HypermediaClasses.activities.userAssignmentActivity,
						activityRel: this.HypermediaRels.assignment,
						activityClass: this.HypermediaClasses.assignments.assignment,
						noCompletion: false,
						activityDetailsFeatureFlag: 'assignmentDetailsEnabled'
					},
					discussion: {
						icon: 'discussions',
						assessmentType: 'discussion',
						canOpen: true,
						instructionsRel: this.HypermediaRels.Discussions.description,
						userActivityUsageClass: this.HypermediaClasses.activities.userDiscussionActivity,
						activityRel: this.HypermediaRels.Discussions.topic,
						activityClass: this.HypermediaClasses.discussions.topic,
						noCompletion: true,
						activityDetailsFeatureFlag: 'discussionDetailsEnabled'
					},
					quiz: {
						icon: 'quizzing',
						assessmentType: 'quiz',
						canOpen: false,
						instructionsRel: this.HypermediaRels.Quizzes.description,
						userActivityUsageClass: this.HypermediaClasses.activities.userQuizActivity,
						activityRel: this.HypermediaRels.quiz,
						activityClass: this.HypermediaClasses.quizzes.quiz,
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
						userActivityUsageClass: this.HypermediaClasses.activities.userContentActivity,
						usagePredicate: function(userActivityUsage) {
							return userActivityUsage && userActivityUsage.hasClass(this.HypermediaClasses.content.topic);
						}.bind(this),
						activityRel: this.HypermediaRels.content,
						activityClass: this.HypermediaClasses.content.sequencedActivity,
						noCompletion: false,
						activityDetailsFeatureFlag: 'NOT_IMPLEMENTED'
					}
				};
			}
		}
	},

	_allTypes: ['assignment', 'discussion', 'quiz', 'content'],

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
	window.D2L.Hypermedia.HMConstantsBehavior,
	window.D2L.UpcomingAssessments.StatusBadgeBehavior,
	typesBehaviorImpl
];

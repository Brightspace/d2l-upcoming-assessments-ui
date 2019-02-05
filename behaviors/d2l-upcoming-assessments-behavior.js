import SirenParse from 'siren-parser';
import { Actions, Classes, Rels } from 'd2l-hypermedia-constants';
import './date-behavior.js';
import './types-behavior.js';
import './status-badge-behavior.js';

window.D2L = window.D2L || {};
window.D2L.UpcomingAssessments = window.D2L.UpcomingAssessments || {};

/*
* @polymerBehavior window.D2L.UpcomingAssessments.UpcomingAssessmentsBehavior
*/
var upcomingAssessmentsBehaviorImpl = {

	properties: {
		userUrl: String,
		getToken: {
			type: Object,
			value: function() {
				return null;
			}
		},
		_showError: {
			type: Boolean,
			value: false
		},
		_firstName: String,
		_allActivities: {
			type: Array,
			value: function() {
				return [];
			}
		},
		_previousPeriodUrl: String,
		_nextPeriodUrl: String,
		_periodStart: String,
		_periodEnd: String
	},

	_getOrganizationRequest: function(userActivityUsage, getToken, userUrl) {
		var organizationLink = (userActivityUsage.getLinkByRel(Rels.organization) || {}).href;
		return this._fetchEntityWithToken(organizationLink, getToken, userUrl);
	},

	_findActivityHref: function(userActivityUsage) {
		for (var i = 0; i < this._allTypes.length; i++) {
			var activityRel = (this._types[this._allTypes[i]] || {}).activityRel;
			if (!activityRel) {
				continue;
			}
			var link = userActivityUsage.getLinkByRel(activityRel);
			if (link) {
				return link.href;
			}
		}
		return '';
	},

	_getActivityRequest: function(userActivityUsage, getToken, userUrl) {
		var activityLink = this._findActivityHref(userActivityUsage);
		return Promise.resolve(this._fetchEntityWithToken(activityLink, getToken, userUrl))
			.catch(function(err) {
				var status = typeof err === 'number' ? err : err && err.status;
				if (typeof status === 'number' && status >= 400 && status < 500) {
					return null;
				}
				throw err;
			});
	},

	_getInstructions: function(type, activity) {
		var item = this._types[type];
		if (!item) {
			return '';
		}
		return this._getRichTextValuePreferPlainText(activity.getSubEntityByRel(item.instructionsRel));
	},

	_getRichTextValuePreferPlainText: function(richtextEntity) {
		if (!richtextEntity || !richtextEntity.hasClass(Classes.text.richtext) ||
			(!richtextEntity.properties.text && !richtextEntity.properties.html)) {
			return '';
		}

		return richtextEntity.properties.text || richtextEntity.properties.html;
	},

	_concatActivityUsageTypes: function(usageList) {
		var usages = [];
		this._allTypes.forEach(function(typeString) {
			var type = this._types[typeString];
			var entities = usageList.getSubEntitiesByClass(type.userActivityUsageClass);
			if (type.usagePredicate) {
				entities = entities.filter(type.usagePredicate);
			}
			usages = usages.concat(entities);
		}.bind(this));
		return usages;
	},

	_getActivityStatus: function(type, userActivityUsage, overdueUserUsages) {
		var item = this._types[type];
		if (!item) {
			return '';
		}
		return this._getStatusBadge(userActivityUsage, overdueUserUsages, item);
	},

	_getIconSetKey: function(entity, tierClass) {
		if (!entity.getSubEntityByClass(tierClass)) {
			return null;
		}
		return (entity.getSubEntityByClass(tierClass)).properties.iconSetKey;
	},

	/*
	* Returns an object that contains the information required to populate an assessment list item
	*/
	_getUserActivityUsagesInfos: function(userActivityUsages, overdueUserActivityUsages, getToken, userUrl) {
		if (!userActivityUsages.entities) {
			return;
		}

		var requests = [];

		var overdueUserUsages = this._concatActivityUsageTypes(overdueUserActivityUsages);
		var supportedUserUsages = this._concatActivityUsageTypes(userActivityUsages);

		supportedUserUsages.forEach(function(userActivityUsage) {
			var organizationRequest = this._getOrganizationRequest.call(this, userActivityUsage, getToken, userUrl);
			var activityRequest = this._getActivityRequest.call(this, userActivityUsage, getToken, userUrl);
			var userActivityUsageHref = userActivityUsage.getLinkByRel('self').href;

			var request = Promise.all([activityRequest, organizationRequest])
				.then(function(response) {
					var activity = response[0];
					var organization = response[1];

					if (!activity) {
						return null;
					}

					var type = this._getActivityType(activity);
					var statusDetails = this._getActivityStatus(type, userActivityUsage, overdueUserUsages);
					var info = this._getInstructions(type, activity);

					var tier2IconKey = this._getIconSetKey(activity, 'tier2');

					return {
						name: activity.properties.name || activity.properties.title,
						courseName: organization.properties.name,
						info: info,
						dueDate: statusDetails.dueDateState.dueDate,
						endDate: statusDetails.endDateState.endDate,
						statusConfig: statusDetails.statusConfig,
						type: type,
						userActivityUsageHref: userActivityUsageHref,
						isCompleted: statusDetails.completionState.isCompleted,
						tier2IconKey: tier2IconKey,
					};
				}.bind(this));

			requests.push(request);
		}.bind(this));

		return Promise.all(requests)
			.then(function(responses) {
				var successResponses = responses.filter(function(response) {
					return !!response;
				});
				if (responses.length && !successResponses.length) {
					return Promise.reject(new Error('All activity requests failed'));
				}
				return successResponses;
			});
	},

	_getUserActivityUsages: function(userEntity, getToken, userUrl) {
		var myActivitiesLink = (userEntity.getLinkByRel(Rels.Activities.myActivities) || {}).href;
		var self = this;

		if (myActivitiesLink) {
			return this._getCustomRangeAction(myActivitiesLink, userUrl)
				.then(function(actitiviesLink) {
					return self._fetchEntityWithToken(actitiviesLink, getToken, userUrl);
				});
		}
	},

	_getOverdueActivities: function(activities, getToken, userUrl) {
		var overdueActivitiesLink = (activities.getLinkByRel(Rels.Activities.overdue) || {}).href;

		if (overdueActivitiesLink) {
			return this._fetchEntityWithToken(overdueActivitiesLink, getToken, userUrl);
		}

		// API doesn't include the overdue link if user doesn't have any overdue activities
		return SirenParse({});
	},

	_getCustomRangeAction: function(activitiesUrl, userUrl) {
		if (!activitiesUrl) {
			return Promise.reject();
		}

		var self = this;

		return this._fetchEntityWithToken(activitiesUrl, this.getToken, userUrl)
			.then(function(activities) {
				var currentTime = new Date();
				var parameters = self._getCustomDateRangeParameters(currentTime);
				var action = (activities.getActionByName(Actions.activities.selectCustomDateRange) || {});

				self._selectCustomDateRangeAction = action;
				return self._createActionUrl(action, parameters);
			});
	},

	_getCustomDateRangeParameters: function(selectedDate) {
		var day = selectedDate.getDay();
		var startDate = new Date(selectedDate.setDate(selectedDate.getDate() - day));
		startDate.setHours(0, 0, 0, 0);
		var start = startDate.toISOString();
		var twoWeeksFromStart = new Date(startDate.setDate(startDate.getDate() + 13));
		twoWeeksFromStart.setHours(23, 59, 59, 999);
		var end = twoWeeksFromStart.toISOString();

		return {
			start: start,
			end: end
		};
	},

	_getUser: function(userUrl, getToken) {
		return this._fetchEntityWithToken(userUrl, getToken);
	},

	_getInfo: function() {
		this._showError = false;
		var self = this;

		return this._fetchEntityWithToken(this.userUrl, this.getToken)
			.then(function(userEntity) {
				self._firstName = (userEntity.getSubEntityByRel(Rels.firstName) || { properties: {} }).properties.name;
				var myActivitiesLink = (userEntity.getLinkByRel(Rels.Activities.myActivities) || {}).href;
				return self._getCustomRangeAction(myActivitiesLink, self.userUrl)
					.then(function(customActivitiesLink) {
						return self._loadActivitiesForPeriod(customActivitiesLink);
					});
			})
			.catch(function() {
				self._showError = true;
				self._firstName = null;
			});
	},

	_loadActivitiesForPeriod: function(periodUrl) {
		if (!periodUrl) {
			return Promise.reject();
		}

		var self = this;
		var userActivityUsages;

		return this._fetchEntityWithToken(periodUrl, this.getToken, this.userUrl)
			.then(function(userUsages) {
				userActivityUsages = userUsages;
				self._previousPeriodUrl = (userActivityUsages.getLinkByRel(Rels.Activities.previousPeriod) || {}).href;
				self._nextPeriodUrl = (userActivityUsages.getLinkByRel(Rels.Activities.nextPeriod) || {}).href;
				self._periodStart = userActivityUsages.properties.start;
				self._periodEnd = userActivityUsages.properties.end;

				return self._getOverdueActivities(userActivityUsages, self.getToken, self.userUrl);
			})
			.then(function(overdueUserActivityUsages) {
				return self._getUserActivityUsagesInfos(userActivityUsages, overdueUserActivityUsages, self.getToken, self.userUrl);
			})
			.then(function(userActivityUsagesInfos) {
				return self._updateActivitiesInfo(userActivityUsagesInfos, self.getToken, self.userUrl);
			})
			.then(function(activities) {
				self.set('_allActivities', activities);
				return activities;
			});
	},

	_updateActivitiesInfo: function(activities) {
		activities = activities || [];
		return activities
			.filter(function(activity) {
				return activity.dueDate || activity.endDate;
			})
			.sort(function(a, b) {
				return (new Date(a.dueDate || a.endDate)) > (new Date(b.dueDate || b.endDate)) ? 1 : -1;
			});
	},

	_createActionUrl: function(action, parameters) {
		var query = {};
		if (action.fields) {
			action.fields.forEach(function(field) {
				if (parameters.hasOwnProperty(field.name)) {
					query[field.name] = parameters[field.name];
				} else {
					query[field.name] = field.value;
				}
			});
		}

		var queryString = Object.keys(query).map(function(key) {
			return key + '=' + query[key];
		}).join('&');

		return queryString ? action.href + '?' + queryString : action.href;
	},

	_upcomingAssessmentsBehaviour_resetData: function() {
		this._showError = false;
		this._firstName = null;
		this._allActivities = [];
		this._previousPeriodUrl = null;
		this._nextPeriodUrl = null;
		this._periodStart = null;
		this._periodEnd = null;
	}
};

window.D2L.UpcomingAssessments.UpcomingAssessmentsBehavior = [
	window.D2L.UpcomingAssessments.DateBehavior,
	D2L.UpcomingAssessments.TypesBehavior,
	D2L.PolymerBehaviors.FetchSirenEntityBehavior,
	window.D2L.UpcomingAssessments.StatusBadgeBehavior,
	upcomingAssessmentsBehaviorImpl
];

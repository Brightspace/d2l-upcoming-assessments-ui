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
		return usageList.filter(this._isSupportedType.bind(this));
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
		if (!Array.isArray(userActivityUsages) || userActivityUsages.length === 0) {
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
		var myActivitiesLink = (
			userEntity.getLinkByRel(Rels.Activities.myActivitiesEmpty)
			|| userEntity.getLinkByRel(Rels.Activities.myActivities)
			|| {}
		).href;

		var self = this;

		if (myActivitiesLink) {
			return this._fetchEntityWithToken(myActivitiesLink, getToken, userUrl)
				.then(function(activitiesEntity) {
					var customRangeActionHref = self._getCustomRangeAction(activitiesEntity);

					return self._fetchEntityWithToken(customRangeActionHref, getToken, userUrl);
				});
		}
	},

	_getOverdueActivities: function(activitiesEntity, getToken, userUrl) {
		var overdueActivitiesLink = (activitiesEntity.getLinkByRel(Rels.Activities.overdue) || {}).href;

		if (overdueActivitiesLink) {
			return this._fetchEntityWithToken(overdueActivitiesLink, getToken, userUrl);
		}

		// API doesn't include the overdue link if user doesn't have any overdue activities
		return SirenParse({});
	},

	_getCustomRangeAction: function(activitiesEntity, dateObj) {
		var self = this;
		var date = dateObj || new Date();

		var parameters = self._getCustomDateRangeParameters(date);
		var action = (activitiesEntity.getActionByName(Actions.activities.selectCustomDateRange) || {});

		return self._createActionUrl(action, parameters);
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
				var myActivitiesLink = (
					userEntity.getLinkByRel(Rels.Activities.myActivitiesEmpty)
					|| userEntity.getLinkByRel(Rels.Activities.myActivities)
					|| {}
				).href;

				return self._fetchEntityWithToken(myActivitiesLink, self.getToken, self.userUrl);
			})
			.then(function(activitiesEntity) {
				self.__activitiesEntity = activitiesEntity;

				return self._loadActivitiesForPeriod(activitiesEntity, new Date());
			})
			.catch(function() {
				self._showError = true;
				self._firstName = null;
			});
	},

	_loadActivitiesForPeriod: function(activitiesEntity, dateObj) {
		var periodUrl = this._getCustomRangeAction(activitiesEntity, dateObj);
		var self = this;
		var userActivitiesRequest = this._fetchEntityWithToken(periodUrl, this.getToken, this.userUrl);
		var overdueActivitiesRequest = this._getOverdueActivities(activitiesEntity, this.getToken, this.userUrl);

		return Promise.all([userActivitiesRequest, overdueActivitiesRequest])
			.then(function(activitiesResponses) {
				var userActivityUsages = activitiesResponses[0];
				var overdueUserActivityUsages = activitiesResponses[1];

				self._previousPeriodUrl = (userActivityUsages.getLinkByRel(Rels.Activities.previousPeriod) || {}).href;
				self._nextPeriodUrl = (userActivityUsages.getLinkByRel(Rels.Activities.nextPeriod) || {}).href;
				self._periodStart = userActivityUsages.properties.start;
				self._periodEnd = userActivityUsages.properties.end;

				var flattenActivityUsages = self._flattenActivities(userActivityUsages);
				var flattenOverdueActivityUsages = self._flattenActivities(overdueUserActivityUsages);
				return Promise.all([
					flattenActivityUsages,
					flattenOverdueActivityUsages
				]).then(function(responses) {
					return self._getUserActivityUsagesInfos(
						responses[0],
						responses[1],
						self.getToken,
						self.userUrl
					);
				});
			})
			.then(function(userActivityUsagesInfos) {
				var activities = self._updateActivitiesInfo(userActivityUsagesInfos, self.getToken, self.userUrl);

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
	},

	/*
	* Returns a flattened list of user-activity-usages, deduplicating where necessary
	* If a user-content-activity points to a supported domain-specific user-activity-usage,
	* that content activity is removed, and only the domain activity is added.
	* Linked subentities are hydrated, and the date restrictions of the
	* parent content activity are projected onto the child activity when missing.
	*/
	_flattenActivities: function(activities) {
		var activityEntities;
		var self = this;
		if (Array.isArray(activities)) {
			activityEntities = activities;
		} else {
			activityEntities = activities.entities || [];
		}
		var supportedActivities = activityEntities.filter(this._isSupportedType.bind(this));
		var activitiesContext = this._createNormalizedEntityMap(supportedActivities);
		var flattenedActivities = Array.from(activitiesContext.activitiesMap.values());
		return self._hydrateActivityEntities(flattenedActivities)
			.then(function(hydratedActivities) {
				var activitiesMap = activitiesContext.activitiesMap;
				var parentActivitiesMap = activitiesContext.parentActivitiesMap;
				var redundantActivities = [];
				// Normalize activity data prior to deduping; eg, some activities don't
				// have a due date (surveys), while the content topic can
				hydratedActivities.forEach(function(activity) {
					var canonicalActivity = activity;
					var activitySelfLink = activity.getLinkByRel('self').href;
					if (parentActivitiesMap.has(activitySelfLink)) {
						var parentActivity = parentActivitiesMap.get(activitySelfLink);
						// There are cases where a content topic child activity (eg. a survey activity) doesn't
						// have the same set of restrictions as the content topic itself. Because we only want to
						// display one version of the same logical activity, we'll use the child activity,
						// but ensure it has the superset of data from the content topic (due date).
						// Since our data model is currently based on the LMS Siren entities,
						// create and parse a new synthetic entity.
						if (!activity.hasEntityByClass('due-date') && parentActivity.hasEntityByClass('due-date')) {
							var parentDueDate = parentActivity.getSubEntityByClass('due-date');
							// Create new object with updated helper functions
							canonicalActivity = SirenParse({
								class: activity.class,
								rel: activity.rel,
								properties: activity.properties,
								entities: [parentDueDate].concat(activity.entities || []),
								actions: activity.actions,
								links: activity.links
							});
						}
						// Ensure we only have a single representation of the same logical activity,
						// preferring the child activity
						redundantActivities.push(parentActivity.getLinkByRel('self').href);
					}
					activitiesMap.set(activitySelfLink, canonicalActivity);
				});
				return Array.from(activitiesMap.values())
					.filter(function(activity) {
						return !redundantActivities.includes(activity.getLinkByRel('self').href);
					});
			});
	},

	_createNormalizedEntityMap: function(activityEntities) {
		var activitiesMap = new Map();
		var parentActivitiesMap = new Map();
		var allActivities = [];
		var self = this;
		activityEntities
			.map(SirenParse)
			.forEach(function(activity) {
				var childActivity = activity.getSubEntityByRel(Rels.Activities.childUserActivityUsage);
				if (childActivity) {
					// @NOTE: Possible bug in node-siren-parser means linked subentities don't have
					// helper functions, so, re-parse if so.
					if (childActivity.href) {
						var childActivityHref = childActivity.href; // Save because parsing it in isolation dumps this..
						childActivity =  SirenParse(childActivity);
						childActivity.href = childActivityHref;
					}
					var childSelfLink = childActivity.href || (childActivity.getLinkByRel('self') || {}).href;
					parentActivitiesMap.set(childSelfLink, activity);
					if (self._isSupportedType(childActivity)) {
						allActivities.push(childActivity);
					}
				}
				allActivities.push(activity);
			});
		// Dedupe activities, preferring already-hydrated version of any entities
		allActivities.forEach(function(activityEntity) {
			var selfLink = (activityEntity.getLinkByRel('self') || {}).href
				|| activityEntity.href;
			// Save the entity if it doesn't exist, or the current representation is a linked subentity
			// (has an href directly on the entity)
			if (!activitiesMap.has(selfLink) || activitiesMap.get(selfLink).href !== undefined) {
				activitiesMap.set(selfLink, activityEntity);
			}
		});
		return {
			activitiesMap: activitiesMap,
			parentActivitiesMap: parentActivitiesMap,
		};
	},

	/*
	* On success, all activities, with linked subentities hydrated
	*/
	_hydrateActivityEntities: function(activityEntities) {
		var self = this;
		// Already-complete entities
		var hydratedActivities = activityEntities
			.filter(function(entity) {
				return !entity.href;
			});
		var activityPromises = activityEntities
			.filter(function(entity) {
				return entity.href;
			})
			.map(function(entity) {
				return self._fetchEntityWithToken(entity.href, self.getToken, self.userUrl)
					.then(SirenParse);
			});
		return Promise.all(activityPromises)
			.then(function(entities) {
				return hydratedActivities.concat(entities);
			});
	},

	_isSupportedType: function(usage) {
		var self = this;
		return this._allTypes.some(function(typeString) {
			var type = self._types[typeString];
			if (usage.hasClass(type.userActivityUsageClass)) {
				return type.usagePredicate
					? type.usagePredicate(usage)
					: true;
			}
		});
	}
};

window.D2L.UpcomingAssessments.UpcomingAssessmentsBehavior = [
	window.D2L.UpcomingAssessments.DateBehavior,
	D2L.UpcomingAssessments.TypesBehavior,
	D2L.PolymerBehaviors.FetchSirenEntityBehavior,
	window.D2L.UpcomingAssessments.StatusBadgeBehavior,
	upcomingAssessmentsBehaviorImpl
];

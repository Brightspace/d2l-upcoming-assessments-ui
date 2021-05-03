import SirenParse from 'siren-parser';
import { Actions, Classes, Rels } from 'd2l-hypermedia-constants';
import './date-behavior.js';
import './types-behavior.js';
import './status-badge-behavior.js';

window.D2L = window.D2L || {};
window.D2L.UpcomingAssessments = window.D2L.UpcomingAssessments || {};

class UpcomingAssessmentsTimer {
	times;
	constructor() {
		this.times = {};
	}

	get active() {
		// TODO: look for a flag on the window, create a util with "start timing and endtiming" methods
		return true;
	}

	get logStartTimes() {
		return false;
	}

	startTimer(key, requestType, wait) {
		if (!this.active) {
			return;
		}

		this.times[key] = this.times[key] || {};

		this.times[key][requestType] = {
			time: Date.now(),
			requestType: requestType,
		};
		if (this.logStartTimes) {
			console.log(`Starting requests for ${requestType} (${key})`); // eslint-disable-line no-console
		}
		return (resolveAllInBatch) => {
			this.endTimer(key, requestType, { resolve: !wait, resolveAllInBatch: resolveAllInBatch });
		};
	}

	endTimer(key, requestType, options = {}) {
		if (!this.active) {
			return;
		}

		const val = this.times[key][requestType];
		val.endTime = (Date.now() - val.time) / 1000;
		if (!val) {
			console.log(`Requests done for ${key} ${requestType}, no initial timer was found`); // eslint-disable-line no-console
			return;
		}
		if (options.resolve) {
			console.log(`${val.requestType} fetched, elapsed time: ${val.endTime} seconds (${key})`); // eslint-disable-line no-console
			delete this.times[key][requestType];
		}
		if (options.resolveAllInBatch) {
			const innerMessages = {};
			for (const i in this.times[key]) {
				const cur = this.times[key][i];
				innerMessages[cur.requestType] = `elapsed time: ${cur.endTime} seconds`;
				delete this.times[key][i];
			}
			console.log(`${requestType} fetched, elapsed time: ${(Date.now() - val.time) / 1000} (${key})`, innerMessages);  // eslint-disable-line no-console
		}
	}

	resetTimers() {
		this.times = {};
	}
}

function getTimerKey(str) {
	return str + ' ' + Math.random() * 1000;
}

const timer = new UpcomingAssessmentsTimer();

/*
* @polymerBehavior window.D2L.UpcomingAssessments.UpcomingAssessmentsBehavior
*/
var upcomingAssessmentsBehaviorImpl = {

	properties: {
		userUrl: String,
		getToken: {
			type: Object,
			value: () => null
		},
		_showError: {
			type: Boolean,
			value: false
		},
		_firstName: String,
		_allActivities: {
			type: Array,
			value: () => [],
		},
		_previousPeriodUrl: String,
		_nextPeriodUrl: String,
		_periodStart: String,
		_periodEnd: String
	},

	_getOrganizationRequest: async function(userActivityUsage, getToken, userUrl, abortSignal, timerKey) {
		const endTimer = timer.startTimer(timerKey, 'organizationRequest', true);
		const organizationLink = (userActivityUsage.getLinkByRel(Rels.organization) || {}).href;
		const organization = await this._fetchEntityWithToken({
			link: organizationLink,
			userLink: userUrl,
			getToken: getToken,
			requestInit: {
				signal: abortSignal,
			},
		});
		endTimer();
		return organization;
	},

	_findActivityHref: function(userActivityUsage) {
		for (let i = 0; i < this._allTypes.length; i++) {
			const activityRel = (this._types[this._allTypes[i]] || {}).activityRel;
			if (!activityRel) {
				continue;
			}
			const link = userActivityUsage.getLinkByRel(activityRel);
			if (link) {
				return link.href;
			}
		}
		return '';
	},

	_getActivityRequest: async function(userActivityUsage, getToken, userUrl, timerKey) {
		const endTimer = timer.startTimer(timerKey, 'activityRequest', true);
		const activityLink = this._findActivityHref(userActivityUsage);
		try {
			const activity = await this._fetchEntityWithToken(activityLink, getToken, userUrl);
			endTimer();
			return activity;
		} catch (err) {
			const status = typeof err === 'number' ? err : err && err.status;
			if (typeof status === 'number' && status >= 400 && status < 500) {
				return null;
			}
			endTimer();
			throw err;
		}
	},

	_getInstructions: function(type, activity) {
		const item = this._types[type];
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
		const item = this._types[type];
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
	_getUserActivityUsagesInfos: async function(
		userActivityUsages,
		overdueUserActivityUsages,
		getToken,
		userUrl,
		abortSignal,
	) {
		const timerKey = getTimerKey(userUrl);
		const endTimer = timer.startTimer(timerKey, 'userActivityUsagesInfos');
		if (!Array.isArray(userActivityUsages) || userActivityUsages.length === 0) {
			return;
		}

		const overdueUserUsages = this._concatActivityUsageTypes(overdueUserActivityUsages);
		const supportedUserUsages = this._concatActivityUsageTypes(userActivityUsages);

		const requests = supportedUserUsages.map(async(userActivityUsage) => {
			const organizationRequest = this._getOrganizationRequest.call(this, userActivityUsage, getToken, userUrl, abortSignal, timerKey);
			const activityRequest = this._getActivityRequest.call(this, userActivityUsage, getToken, userUrl, timerKey);
			const userActivityUsageHref = userActivityUsage.getLinkByRel('self').href;

			const [activity, organization] = await Promise.all([activityRequest, organizationRequest]);
			if (!activity) {
				return null;
			}

			const type = this._getActivityType(activity);
			const statusDetails = this._getActivityStatus(type, userActivityUsage, overdueUserUsages);
			const info = this._getInstructions(type, activity);

			const tier2IconKey = this._getIconSetKey(activity, 'tier2');

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
		});

		const responses = await Promise.all(requests);
		const successResponses = responses.filter((response) => {
			return !!response;
		});
		if (responses.length && !successResponses.length) {
			return Promise.reject(new Error('All activity requests failed'));
		}
		endTimer();
		return successResponses;
	},

	_getUserActivityUsages: async function(userEntity, getToken, userUrl) {
		const endTimer = timer.startTimer(getTimerKey(userUrl), 'userActivityUsages');
		const myActivitiesLink = (
			userEntity.getLinkByRel(Rels.Activities.myActivitiesEmpty)
			|| userEntity.getLinkByRel(Rels.Activities.myActivities)
			|| {}
		).href;

		if (myActivitiesLink) {
			const activitiesEntity = await this._fetchEntityWithToken(myActivitiesLink, getToken, userUrl);
			const customRangeActionHref = this._getCustomRangeAction(activitiesEntity);

			const myActivities = await this._fetchEntityWithToken(customRangeActionHref, getToken, userUrl);
			endTimer();
			return myActivities;
		}
		endTimer();
	},

	_getOverdueActivities: async function(activitiesEntity, getToken, userUrl, abortSignal, timerKey) {
		const endTimer = timer.startTimer(timerKey || getTimerKey(userUrl), 'overdueUsages', true);
		const overdueActivitiesLink = (activitiesEntity.getLinkByRel(Rels.Activities.overdue) || {}).href;

		if (overdueActivitiesLink) {
			const toReturn = await this._fetchEntityWithToken({
				link: overdueActivitiesLink,
				userLink: userUrl,
				getToken: getToken,
				requestInit: {
					signal: abortSignal,
				}
			});
			endTimer();
			return toReturn;
		}

		endTimer();
		// API doesn't include the overdue link if user doesn't have any overdue activities
		return SirenParse({});
	},

	_getCustomRangeAction: function(activitiesEntity, dateObj) {
		const date = dateObj || new Date();

		const parameters = this._getCustomDateRangeParameters(date);
		const action = (activitiesEntity.getActionByName(Actions.activities.selectCustomDateRange) || {});

		return this._createActionUrl(action, parameters);
	},

	_getCustomDateRangeParameters: function(selectedDate) {
		const day = selectedDate.getDay();
		const startDate = new Date(selectedDate.setDate(selectedDate.getDate() - day));
		startDate.setHours(0, 0, 0, 0);
		const start = startDate.toISOString();
		const twoWeeksFromStart = new Date(startDate.setDate(startDate.getDate() + 13));
		twoWeeksFromStart.setHours(23, 59, 59, 999);
		const end = twoWeeksFromStart.toISOString();

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
		const userUrl = this.userUrl;
		const getToken = this.getToken;
		const timerKey = userUrl + ' info';

		if (!this.__getInfoRequest) {
			this.__getInfoRequest = Promise.resolve();
		}

		if (this.__getInfoAbortController) {
			this.__getInfoAbortController.abort();
		}

		this.__getInfoRequest = this.__getInfoRequest.then(async() => {
			const endInfoRequestTimer = timer.startTimer(timerKey, 'getInfoRequest', true);
			try {
				if (window.AbortController) {
					this.__getInfoAbortController = new AbortController();
				}

				const endUserEntityTimer = timer.startTimer(timerKey, 'userEntity', true);
				const userEntity = await this._fetchEntityWithToken({
					link: userUrl,
					getToken: getToken,
					requestInit: {
						signal: (this.__getInfoAbortController || {}).signal,
					},
				});
				endUserEntityTimer();
				this._firstName = (userEntity.getSubEntityByRel(Rels.firstName) || { properties: {} }).properties.name;
				const myActivitiesLink = (
					userEntity.getLinkByRel(Rels.Activities.myActivitiesEmpty)
					|| userEntity.getLinkByRel(Rels.Activities.myActivities)
					|| {}
				).href;

				const endMyActivitiesTimer = timer.startTimer(timerKey, 'myActivities', true);
				const activitiesEntity = await this._fetchEntityWithToken({
					link: myActivitiesLink,
					userLink: userUrl,
					getToken: getToken,
					requestInit: {
						signal: (this.__getInfoAbortController || {}).signal,
					}
				});
				endMyActivitiesTimer();
				this.__activitiesEntity = activitiesEntity;

				const activities = await this._loadActivitiesForPeriod({
					activitiesEntity: activitiesEntity,
					dateObj: new Date(),
					abortSignal: (this.__getInfoAbortController || {}).signal,
					userUrl: userUrl,
					getToken: getToken,
					timerKey: timerKey,
				});
				this.__getInfoAbortController = null;

				endInfoRequestTimer(true);
				return activities;

			} catch (e) {
				this.__getInfoAbortController = null;

				endInfoRequestTimer(true);
				if (!(e instanceof Error) || e.name !== 'AbortError') {
					this._showError = true;
					this._firstName = null;
				}
			}
		});
		return this.__getInfoRequest;
	},

	_loadActivitiesForPeriod: async function({
		activitiesEntity,
		dateObj,
		abortSignal,
		getToken,
		userUrl,
		timerKey
	}) {
		timerKey = timerKey || userUrl + ' loadAcivities';
		const endLoadActivitiesForPeriod = timer.startTimer(timerKey, 'loadActivitiesForPeriod', true);
		const periodUrl = this._getCustomRangeAction(activitiesEntity, dateObj);

		const endUserActivitiesRequest = timer.startTimer(timerKey, 'endUserActivitiesRequest', true);
		const userActivitiesRequest = this._fetchEntityWithToken({
			link: periodUrl,
			userLink: userUrl,
			getToken: getToken,
			requestInit: {
				signal: abortSignal,
			},
		});
		endUserActivitiesRequest();
		const overdueActivitiesRequest = this._getOverdueActivities(activitiesEntity, getToken, userUrl, abortSignal, timerKey);

		const [userActivityUsages, overdueUserActivityUsages] = await Promise.all([userActivitiesRequest, overdueActivitiesRequest]);
		this._previousPeriodUrl = (userActivityUsages.getLinkByRel(Rels.Activities.previousPeriod) || {}).href;
		this._nextPeriodUrl = (userActivityUsages.getLinkByRel(Rels.Activities.nextPeriod) || {}).href;
		this._periodStart = userActivityUsages.properties.start;
		this._periodEnd = userActivityUsages.properties.end;

		const flattenActivityUsages = this._flattenActivities(userActivityUsages, getToken, userUrl, abortSignal);
		const flattenOverdueActivityUsages = this._flattenActivities(overdueUserActivityUsages, getToken, userUrl, abortSignal);
		const [	flattenedActivityUsages, flattenedOverdueActivityUsages] = await Promise.all([
			flattenActivityUsages,
			flattenOverdueActivityUsages
		]);

		const userActivityUsagesInfos = await this._getUserActivityUsagesInfos(
			flattenedActivityUsages,
			flattenedOverdueActivityUsages,
			getToken,
			userUrl,
			abortSignal,
		);

		const activities = this._updateActivitiesInfo(userActivityUsagesInfos, getToken, userUrl);

		this.set('_allActivities', activities);

		endLoadActivitiesForPeriod(true);
		return activities;
	},

	_updateActivitiesInfo: function(activities) {
		activities = activities || [];
		return activities
			.filter((activity) => {
				return activity.dueDate || activity.endDate;
			})
			.sort((a, b) => {
				return (new Date(a.dueDate || a.endDate)) > (new Date(b.dueDate || b.endDate)) ? 1 : -1;
			});
	},

	_createActionUrl: function(action, parameters) {
		const query = {};
		if (action.fields) {
			action.fields.forEach((field) => {
				if (parameters.hasOwnProperty(field.name)) {
					query[field.name] = parameters[field.name];
				} else if (field.value !== undefined) {
					query[field.name] = field.value;
				}
			});
		}

		const queryString = Object.keys(query).map((key) => {
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
	_flattenActivities: async function(activities, getToken, userUrl, abortSignal) {
		const timerKey = getTimerKey(userUrl);
		const endFlattenActivities = timer.startTimer(timerKey, 'flattenActivities');
		let activityEntities;
		if (Array.isArray(activities)) {
			activityEntities = activities;
		} else {
			activityEntities = activities.entities || [];
		}
		const supportedActivities = activityEntities
			.filter(this._isSupportedType.bind(this))
			.filter(x => !x.hasClass('broken'));

		const activitiesContext = this._createNormalizedEntityMap(supportedActivities);
		const flattenedActivities = Array.from(activitiesContext.activitiesMap.values());
		const hydratedActivities = await this._hydrateActivityEntities(flattenedActivities, getToken, userUrl, abortSignal);
		const activitiesMap = activitiesContext.activitiesMap;
		const parentActivitiesMap = activitiesContext.parentActivitiesMap;
		const redundantActivities = [];
		// Normalize activity data prior to deduping; eg, some activities don't
		// have a due date (surveys), while the content topic can
		hydratedActivities.forEach((activity) => {
			let canonicalActivity = activity;
			const activitySelfLink = activity.getLinkByRel('self').href;
			if (parentActivitiesMap.has(activitySelfLink)) {
				const parentActivity = parentActivitiesMap.get(activitySelfLink);
				// There are cases where a content topic child activity (eg. a survey activity) doesn't
				// have the same set of restrictions as the content topic itself. Because we only want to
				// display one version of the same logical activity, we'll use the child activity,
				// but ensure it has the superset of data from the content topic (due date).
				// Since our data model is currently based on the LMS Siren entities,
				// create and parse a new synthetic entity.
				if (!activity.hasEntityByClass('due-date') && parentActivity.hasEntityByClass('due-date')) {
					const parentDueDate = parentActivity.getSubEntityByClass('due-date');
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
		endFlattenActivities();
		return Array.from(activitiesMap.values())
			.filter((activity) => {
				return !redundantActivities.includes(activity.getLinkByRel('self').href);
			});
	},

	_createNormalizedEntityMap: function(activityEntities) {
		const activitiesMap = new Map();
		const parentActivitiesMap = new Map();
		const allActivities = [];
		activityEntities
			.map(SirenParse)
			.forEach((activity) => {
				let childActivity = activity.getSubEntityByRel(Rels.Activities.childUserActivityUsage);
				if (childActivity) {
					// @NOTE: Possible bug in node-siren-parser means linked subentities don't have
					// helper functions, so, re-parse if so.
					if (childActivity.href) {
						const childActivityHref = childActivity.href; // Save because parsing it in isolation dumps this..
						childActivity = SirenParse(childActivity);
						childActivity.href = childActivityHref;
					}
					const childSelfLink = childActivity.href || (childActivity.getLinkByRel('self') || {}).href;
					parentActivitiesMap.set(childSelfLink, activity);
					if (this._isSupportedType(childActivity)) {
						allActivities.push(childActivity);
					}
				}
				allActivities.push(activity);
			});
		// Dedupe activities, preferring already-hydrated version of any entities
		allActivities.forEach((activityEntity) => {
			const selfLink = (activityEntity.getLinkByRel('self') || {}).href
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
	_hydrateActivityEntities: async function(activityEntities, getToken, userUrl, abortSignal) {
		const timerKey = getTimerKey(userUrl);
		const endHydrateActivities = timer.startTimer(timerKey, 'hydrateActivities');
		// Already-complete entities
		const hydratedActivities = activityEntities
			.filter(entity => {
				return !entity.href;
			});
		const activityPromises = activityEntities
			.filter(entity => {
				return entity.href;
			})
			.map(entity => {
				return this._fetchEntityWithToken({
					link: entity.href,
					userLink: userUrl,
					getToken: getToken,
					requestInit: {
						signal: abortSignal,
					}
				})
					.then(SirenParse);
			});
		const entities = await Promise.all(activityPromises);
		endHydrateActivities();
		return hydratedActivities.concat(entities);
	},

	_isSupportedType: function(usage) {
		return this._allTypes.some(typeString => {
			const type = this._types[typeString];
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

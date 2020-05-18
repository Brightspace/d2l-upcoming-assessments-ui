/**
	`d2l-all-assessments`
	A Widget for viewing all assessments

	@demo demo/d2l-all-assessments.html
*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import 'd2l-colors/d2l-colors.js';
import 'd2l-typography/d2l-typography-shared-styles.js';
import '../behaviors/d2l-upcoming-assessments-behavior.js';
import '../behaviors/date-behavior.js';
import '../behaviors/localize-behavior.js';
import './d2l-all-assessments-list.js';
import './d2l-assessments-list.js';
import './d2l-date-dropdown.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-all-assessments">
	<template strip-whitespace="">
		<style>
			.no-assessments-in-time-frame {
				margin: 0;
				text-align: center;
			}

			d2l-all-assessments-list, .no-assessments-in-time-frame, .period-selection-container {
				padding-top: 40px;
			}

			.period-selection-container {
				display: flex;
				justify-content: center;
				margin-bottom: 10px;
			}
		</style>

		<div class="period-selection-container">
			<d2l-date-dropdown current-period-text="[[_currentPeriodText]]" locale="[[locale]]">
			</d2l-date-dropdown>
		</div>
		<template is="dom-if" if="[[_hasActivities(_allActivities)]]">
			<d2l-all-assessments-list assessment-items="[[_allActivities]]" period-start="[[_periodStart]]" period-end="[[_periodEnd]]" flags="[[flags]]">
			</d2l-all-assessments-list>
		</template>
		<div hidden$="[[_hasActivities(_allActivities)]]" class="no-assessments-in-time-frame">[[_noAssessmentsInThisTimeFrame]]</div>
	</template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);

Polymer({
	is: 'd2l-all-assessments',

	properties: {
		_noAssessmentsInThisTimeFrame: {
			type: String,
			computed: 'localize("noAssessmentsInThisTimeFrame", "userName", _firstName)'
		},
		_currentPeriodText: String,
		flags: {
			type: Object,
			value: function() {
				return {};
			}
		},
		locale: String
	},

	behaviors: [
		window.D2L.UpcomingAssessments.UpcomingAssessmentsBehavior,
		window.D2L.UpcomingAssessments.DateBehavior,
		window.D2L.UpcomingAssessments.LocalizeBehavior
	],

	listeners: {
		'd2l-date-dropdown-value-changed': '_onDateValueChanged'
	},

	observers: [
		'_onApiConfigChanged(userUrl, getToken)'
	],

	_debounceTime: 20,

	_onApiConfigChanged: function() {
		this.debounce('getAllAssessmentsInfo', this._getAllAssessmentsInfo, this._debounceTime);
	},

	_getAllAssessmentsInfo: function() {
		if (this.__dateChangeAbortController) {
			this.__dateChangeAbortController.abort();
		}

		this._resetData();
		this._getInfo()
			.then(this._formatPeriodText.bind(this));
	},

	_hasActivities: function(activities) {
		return activities && activities.length > 0;
	},

	_onDateValueChanged: function(e) {
		if (e.detail.date) {
			if (this.__dateChangeAbortController) {
				this.__dateChangeAbortController.abort();
			}

			if (!this.__dateChangeActivityLoadRequest) {
				this.__dateChangeActivityLoadRequest = Promise.resolve();
			}

			const ctx = {
				activitiesEntity: this.__activitiesEntity,
				getToken: this.getToken,
				userUrl: this.userUrl,
			};

			this.__dateChangeActivityLoadRequest = this.__dateChangeActivityLoadRequest
				.then(() => {
					this.__dateChangeAbortController = new AbortController();

					return this._loadActivitiesForPeriod({
						activitiesEntity: ctx.activitiesEntity,
						dateObj: e.detail.date,
						abortController: this.__dateChangeAbortController,
						getToken: ctx.getToken,
						userUrl: ctx.userUrl,
					});
				})
				.then(this._formatPeriodText.bind(this))
				.catch((e) => {
					if (!(e instanceof Error) || e.name !== 'AbortError') {
						this._showError = true;
						this._firstName = null;
					}
				})
				.finally(() => {
					this.__dateChangeAbortController = null;
				});

			return this.__dateChangeActivityLoadRequest;
		}
	},

	_formatPeriodText: function() {
		var startDateDate = new Date(this._periodStart);
		var endDateDate = new Date(this._periodEnd);

		var startDateString = this.formatDate(startDateDate, { format: 'monthDay' });
		var endDateString;
		if (startDateDate && endDateDate && (startDateDate.getMonth() === endDateDate.getMonth())) {
			endDateString = endDateDate.getDate();
		} else {
			endDateString = this.formatDate(endDateDate, { format: 'monthDay' });
		}

		this._currentPeriodText = this.localize('currentPeriod', 'startDate', startDateString, 'endDate', endDateString);
	},

	_resetData: function() {
		this._currentPeriodText = null;
		this._upcomingAssessmentsBehaviour_resetData();
	}
});

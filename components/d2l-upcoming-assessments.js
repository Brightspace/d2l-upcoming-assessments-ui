/**
	`d2l-upcoming-assessments`
	A Widget for viewing upcoming assessments

	@demo demo/d2l-upcoming-assessments.html
*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/polymer/polymer-legacy.js';

import 'd2l-colors/d2l-colors.js';
import 'd2l-link/d2l-link.js';
import 'd2l-typography/d2l-typography-shared-styles.js';
import '../behaviors/d2l-upcoming-assessments-behavior.js';
import '../behaviors/date-behavior.js';
import '../behaviors/localize-behavior.js';
import './d2l-all-assessments-list.js';
import './d2l-assessments-list.js';
import './d2l-date-dropdown.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-upcoming-assessments">
	<template strip-whitespace="">
		<style>
			:host {
				display: flex;
				flex-direction: column;
				flex-grow: 1;
				min-width: 0;
			}

			h2 {
				font-weight: normal;
				margin-left: 15px;
			}

			d2l-simple-overlay {
				border-top: 0;
				user-select: text;
				-webkit-user-select: text;
				-moz-user-select: text;
				-ms-user-select: text;
			}

			d2l-simple-overlay-close-button {
				line-height: 60px;
				padding: 0px;
			}

			d2l-simple-overlay-close-button span {
				@apply --d2l-body-small-text;
				text-transform: uppercase;
				padding-left: 7px;
			}

			.period-selection-container {
				display: flex;
				justify-content: center;
				margin-bottom: 10px;
			}

			:host(:dir(rtl)) h2 {
				margin-left: 0px;
				margin-right: 15px;
			}

			.error-message,
			.no-upcoming-assessments,
			.view-all-container {
				@apply --d2l-body-compact-text;
			}

			.view-all-assignments-text {
				font-size: 0.7rem;
				font-weight: normal;
				margin-bottom: 0;
			}

			.no-assessments-in-time-frame {
				text-align: center;
			}

			.view-all-container {
				display: flex;
				justify-content: space-between;
				align-items: center;
				box-sizing: border-box;
				padding: 0 30px;
				margin-left: auto;
				margin-right: auto;
				max-width: 1230px;
			}

			.overlay-close-button-content-wrapper {
				display: inline-flex;
				align-items: center;
				vertical-align: middle;
				border: 1px solid transparent;
				padding: 8px;
				outline: 0;
			}

			.overlay-close-button-content-wrapper:focus, .overlay-close-button-content-wrapper:hover {
				border-radius: 0.3rem;
				border-color: var(--d2l-color-celestuba);
				outline: 0;
			}

			.overlay-close-button-content-wrapper:hover span, .overlay-close-button-content-wrapper:focus span,
			.overlay-close-button-content-wrapper:hover d2l-icon, .overlay-close-button-content-wrapper:focus d2l-icon {
				color: var(--d2l-color-celestuba);
			}

			.wrapper {
				flex-grow: 1;
			}
		</style>


		<div class="wrapper">
			<div class="no-upcoming-assessments" hidden$="[[!_showNoUpcomingAssessmentsMessage(_assessments, _showError)]]">
				  [[_noUpcomingAssessments]]
			</div>

			<template is="dom-if" if="[[_showUpcomingAssessments(_assessments, _showError)]]">
				<d2l-assessments-list assessment-items="[[_assessments]]" flags="[[flags]]">
				</d2l-assessments-list>
			</template>

			<div hidden$="[[!_showError]]" class="error-message">[[localize('errorMessage')]]</div>
		</div>

		<d2l-link class="view-all-assignments-link" href="javascript:void(0);" on-tap="openAllAssignmentsView" on-keypress="_keypressOpenAllAssignmentsView" hidden$="[[_showError]]" tabindex="0">
			<h3 class="view-all-assignments-text">[[localize('viewAllAssignments')]]</h3>
	</d2l-link>
	</template>


</dom-module>`;

document.head.appendChild($_documentContainer.content);

Polymer({
	is: 'd2l-upcoming-assessments',

	properties: {
		loaded: {
			type: Boolean,
			notify: true,
			readOnly: true,
			reflectToAttribute: true,
			value: false
		},
		totalCount: {
			type: Number,
			notify: true,
			readOnly: true,
			reflectToAttribute: true,
			value: 0
		},
		flags: {
			type: Object,
			value: function() {
				return {};
			}
		},
		_assessments: {
			type: Array,
			value: function() {
				return [];
			}
		},
		_noUpcomingAssessments: {
			type: String,
			computed: 'localize("noUpcomingAssessments", "userName", _firstName)'
		},
		_closeSimpleOverlayText: {
			type: String
		},
		_selectCustomDateRangeAction: Object
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

	ready: function() {
		var mql = window.matchMedia('(max-width: 767px)');
		this._updateCloseSimpleOverlayText(mql.matches);
		mql.addListener(this._mobileBreakpointListener.bind(this));
	},

	_debounceTime: 20,

	_getUpcomingAssessmentsInfo: function() {
		this._resetData();
		return this._getInfo()
			.then(this._getUpcomingAssessments.bind(this))
			.catch(function() {
				self._showError = true;
				self._firstName = null;
			});
	},

	_onApiConfigChanged: function() {
		this.debounce('getUpcomingAssessmentsInfo', this._getUpcomingAssessmentsInfo, this._debounceTime);
	},

	_showUpcomingAssessments: function(assessments, showError) {
		return !showError && assessments && assessments.length > 0;
	},

	_showNoUpcomingAssessmentsMessage: function(assessments, showError) {
		return !showError && (!assessments || assessments.length <= 0);
	},

	_hasActivities: function(activities) {
		return activities && activities.length > 0;
	},

	_updateActivitiesInfo: function(activities) {
		activities = activities || [];
		return activities
			.filter(function(activity) {
				return activity.dueDate || activity.endDate;
			})
			.sort(function(a, b) {
				return (a.dueDate || a.endDate) > (b.dueDate || b.endDate);
			});
	},

	_keypressOpenAllAssignmentsView: function(e) {
		if (e.code === 'Space' || e.code === 'Enter') {
			return this.openAllAssignmentsView(e);
		}
	},

	openAllAssignmentsView: function() {
		this.dispatchEvent(new CustomEvent('open-immersive-page', {
			detail: {
				pageName: 'view-all-work'
			},
			bubbles: true,
			composed: true
		}));
	},

	_getUpcomingAssessments: function(activities) {
		activities = activities || [];

		var upcomingActivities = activities
			.filter(function(activity) {
				return this.isActivityUpcoming(activity);
			}.bind(this));
		this._setTotalCount(upcomingActivities.length);

		var basicListActivities = upcomingActivities.slice(0, 3);
		this.set('_assessments', basicListActivities);
		this._setLoaded(true);
	},

	_mobileBreakpointListener: function(mqlevent) {
		this._updateCloseSimpleOverlayText(mqlevent.matches);
	},

	_updateCloseSimpleOverlayText: function(isMobile) {
		this._closeSimpleOverlayText = isMobile
			? this.localize('closeSimpleOverlayTextMobile')
			: this.localize('closeSimpleOverlayText');
	},

	_resetData: function() {
		this._setTotalCount(0);
		this._assessments = [];
		this._closeSimpleOverlayText = '';
		this._selectCustomDateRangeAction = null;
		this._setLoaded(false);
		this._upcomingAssessmentsBehaviour_resetData();
	}
});

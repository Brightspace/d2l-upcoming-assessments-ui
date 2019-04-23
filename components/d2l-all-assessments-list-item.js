import '@polymer/polymer/polymer-legacy.js';
import 'd2l-colors/d2l-colors.js';
import 'd2l-icons/d2l-icon.js';
import 'd2l-icons/tier3-icons.js';
import 'd2l-typography/d2l-typography-shared-styles.js';
import '@polymer/iron-icon/iron-icon.js';
import 'd2l-status-indicator/d2l-status-indicator.js';
import '../behaviors/date-behavior.js';
import '../behaviors/localize-behavior.js';
import '../behaviors/types-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-all-assessments-list-item">
	<template strip-whitespace="">
		<style>
			:host {
				display: block;
			}

			.assessment-info {
				display: flex;
				margin: 10px auto;
				background-color: var(--d2l-color-white);
				border: 1px var(--d2l-color-titanius) solid;
				border-radius: 4px;
				padding: 30px;
			}

			.assessment-info.has-activity-details:hover {
				border-color: var(--d2l-color-celestine);
				cursor: pointer;
			}

			.assessment-info.has-activity-details:hover .assessment-title,
			.assessment-info.has-activity-details:hover .activity-icon {
				color: var(--d2l-color-celestine);
			}

			.assessment-info.has-activity-details:hover .assessment-title {
				text-decoration: underline var(--d2l-color-celestine);
			}

			.activity-info-container {
				width: 100%;
			}

			.assessment-title {
				@apply --d2l-heading-3;
				margin: 0;
			}

			.row {
				display: flex;
				align-items: center;
			}

			.meta-container {
				flex-direction: row;
				margin-top: 5px;
			}

			.meta-container .meta-info .spacer {
				display: none;
			}

			.meta-text {
				@apply --d2l-body-standard-text;
				font-size: 0.7rem;
				line-height: 0.9rem;
				display: flex;
				flex-direction: row;
				align-items: center;
				word-wrap: break-word;
			}

			.meta-text.course-name {
				word-break: break-word;
			}

			.emphasis {
				color: var(--d2l-color-cinnabar);
				font-weight: bold;
			}

			.activity-icon, .spacer {
				flex: 0 0 30px;
				margin-right: 30px;
			}

			[dir="rtl"] .activity-icon,
			[dir="rtl"] .spacer {
				margin-right: 0;
				margin-left: 30px;
			}

			d2l-status-indicator:not([hidden]) {
				margin-right: 10px;
			}

			[dir="rtl"] d2l-status-indicator:not([hidden]) {
				margin-left: 10px;
				margin-right: 0px;
			}

			.activity-info {
				display: inline-flex;
				flex: 1;
				align-items: center;
			}

			.meta-info {
				display: inline-flex;
				align-items: center;
			}

			.info {
				@apply --d2l-body-compact-text;
				font-size: 0.8rem;
				font-weight: 300;
				margin-top: 12px;
				max-height: 2.4rem;
				overflow: hidden;
				padding-right: 30px;
			}

			iron-icon.separator-icon {
				opacity: 0.8;
				width: 18px;
				height: 18px;
			}

			[dir="rtl"] .info {
				padding-right: 0px;
				padding-left: 30px;
			}

			@media (min-width: 768px) {
				.meta-container > .spacer {
					display: block;
				}
			}

			@media (max-width: 767px) {
				:host {
					border-radius: 0px;
					border-left: 0px;
					border-right: 0px;
				}

				.info-row {
					display: none;
				}

				.meta-container {
					flex-direction: column;
				}

				.meta-container .meta-info {
					width: 100%;
				}

				.meta-container .meta-info .spacer {
					display: block;
				}

				.meta-container .meta-text .separator-icon {
					display: none;
				}
			}

			.indicator-container {
				display: flex;
				align-items: center;
				padding-left: 30px;
				margin-left: auto;
				width: 20px;
			}

			[dir="rtl"] .indicator-container {
				padding-left: 0;
				margin-left: 0;
				padding-right: 30px;
				margin-right: auto;
			}

			d2l-icon.indicator-icon {
				--d2l-icon-height: 20px;
				--d2l-icon-width: 20px;
			}

			.assessment-info.has-activity-details:hover d2l-icon.indicator-icon {
				color: var(--d2l-color-celestine);
			}

			[hidden] {
				display: none !important;
			}

			.default-hidden {
				display: none;
			}

		</style>
		<div class$="[[_getAssessmentInfoCssClassNames(_canOpenActivityDetails)]]" tabindex$="[[_getAssessmentInfoTabIndex(_canOpenActivityDetails)]]" role$="[[_getAssessmentInfoRole(_canOpenActivityDetails)]]" on-tap="_openActivityDetails" on-keydown="_onKeydownOpenActivityDetails">
			<div class="activity-info-container">
				<div class="row">
					<div class="activity-info">
						<d2l-icon class="activity-icon" icon="[[assessmentIcon]]"></d2l-icon>
						<h3 class="assessment-title">[[assessmentItem.name]]</h3>
						<div class="indicator-container" hidden$="[[!_canOpenActivityDetails]]">
							<d2l-icon class="indicator-icon" icon="d2l-tier3:chevron-right" aria-hidden="true"></d2l-icon>
						</div>
					</div>
				</div>
				<div class="row meta-container">
					<div class="spacer default-hidden"></div>
					<div class="meta-info">
						<div class="spacer"></div>
						<d2l-status-indicator state="[[_statusConfig.state]]" text="[[localize(_statusConfig.text)]]" hidden$="[[!_statusConfig]]"></d2l-status-indicator>
						<div class="meta-text" hidden$="[[!_showEndsText]]">
							<div class="meta-text emphasis">[[_endsText]]</div>
							<iron-icon class="separator-icon" icon="d2l-tier1:bullet"></iron-icon>
						</div>
					</div>
					<div class="meta-info">
						<div class="spacer"></div>
						<div class="meta-text course-name">[[assessmentItem.courseName]]</div>
						<iron-icon class="separator-icon" icon="d2l-tier1:bullet"></iron-icon>
						<div class="meta-text">[[assessmentType]]</div>
					</div>
				</div>
				<div class="row info-row">
					<div class="spacer"></div>
					<div class="info">[[assessmentItem.info]]</div>
				</div>
			</div>
		</div>
	</template>


</dom-module>`;

document.head.appendChild($_documentContainer.content);

Polymer({

	is: 'd2l-all-assessments-list-item',

	properties: {
		assessmentItem: {
			type: Object,
			value: function() {
				return {};
			},
			observer: '_onAssessmentItemChanged'
		},
		assessmentIcon: {
			type: String,
			value: ''
		},
		assessmentType: {
			type: String,
			value: ''
		},
		_endsText: String,
		_statusConfig: {
			type: Object,
			value: null
		},
		_showEndsText: {
			type: Boolean,
			value: false
		},
		flags: {
			type: Object,
			value: function() {
				return {};
			}
		},
		_canOpenActivityDetails: {
			type: Boolean,
			computed: '_computeCanOpenActivityDetails(assessmentItem, flags)'
		}
	},

	behaviors: [
		window.D2L.UpcomingAssessments.DateBehavior,
		window.D2L.UpcomingAssessments.LocalizeBehavior,
		window.D2L.UpcomingAssessments.TypesBehavior
	],

	_onAssessmentItemChanged: function(assessmentItem) {
		this._updateAssessmentIcon(assessmentItem);
		this._updateAssessmentType(assessmentItem);

		this._statusConfig = assessmentItem.statusConfig;

		if (assessmentItem.endDate) {
			var relativeDateString = this._getRelativeDateString(assessmentItem.endDate);
			this._endsText = this.localize('endDateShort', 'endDate', relativeDateString);
			this._showEndsText = this._showOverdue;
		}
	},

	_getRelativeDateString: function(dateUTC) {
		if (!dateUTC) {
			return;
		}

		var dateString;
		var calendarDateDiff = this.getDateDiffInCalendarDays(dateUTC);

		if (calendarDateDiff === 0) {
			return this.localize('today');
		} else if (calendarDateDiff === 1) {
			return this.localize('tomorrow');
		} else if (calendarDateDiff > 1 && calendarDateDiff < 7) {
			dateString = new Date(dateUTC).toLocaleDateString(this.locale, { weekday: 'long' });
		} else {
			dateString = new Intl.DateTimeFormat(this.locale, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(dateUTC));
		}

		return dateString;
	},

	_updateAssessmentIcon: function(assessmentItem) {
		var item = this._types[(assessmentItem || {}).type];
		if (!item) {
			this.assessmentIcon = '';
			return;
		}
		if (typeof item.icon === 'function') {
			this.assessmentIcon = item.icon(assessmentItem);
		} else {
			this.assessmentIcon = item ? ('d2l-tier3:' + item.icon) : '';
		}
	},

	_updateAssessmentType: function(assessmentItem) {
		var item = this._types[assessmentItem.type];
		this.assessmentType = item ? this.localize(item.assessmentType) : '';
	},

	_computeCanOpenActivityDetails: function(assessmentItem, flags) {
		return this._canOpenItemType(assessmentItem, flags)
			&& !!assessmentItem.userActivityUsageHref;
	},

	_openActivityDetails: function() {
		var self = this;
		if (this._canOpenActivityDetails) {
			this.dispatchEvent(new CustomEvent('open-immersive-page', {
				bubbles: true,
				detail: {
					pageName: 'activity-details',
					userActivityUsageHref: self.assessmentItem.userActivityUsageHref
				},
				composed: true
			}));
		}
	},

	_onKeydownOpenActivityDetails: function(e) {
		if (e.keyCode === 13 || e.keyCode === 32) {
			this._openActivityDetails();
		}
	},

	_getAssessmentInfoCssClassNames: function(canOpenActivityDetails) {
		var classNames = 'assessment-info';
		if (canOpenActivityDetails) {
			classNames = classNames + ' has-activity-details';
		}
		return classNames;
	},

	_getAssessmentInfoTabIndex: function(canOpenActivityDetails) {
		if (canOpenActivityDetails) {
			return 0;
		}
	},

	_getAssessmentInfoRole: function(canOpenActivityDetails) {
		var role = 'listItem';
		if (canOpenActivityDetails) {
			role += ' link';
		}
		return role;
	}

});

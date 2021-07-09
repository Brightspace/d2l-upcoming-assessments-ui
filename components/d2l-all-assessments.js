import { css, html, LitElement } from 'lit-element';
import { ifDefined } from 'lit-html/directives/if-defined';
import '@brightspace-ui/core/components/inputs/input-date';
import '@brightspace-ui/core/components/colors/colors';
import '@brightspace-ui/core/components/typography/typography';
import { LocalizeDynamicMixin } from '@brightspace-ui/core/mixins/localize-dynamic-mixin';
import { HypermediaStateMixin, observableTypes } from '@brightspace-hmc/foundation-engine/framework/lit/HypermediaStateMixin';
import '@brightspace-hmc/foundation-components/features/workToDo/d2l-w2d-collections';

const rel = Object.freeze({
	myActivities: 'https://activities.api.brightspace.com/rels/my-activities#empty',
});

class D2LAllAssessments extends LocalizeDynamicMixin(HypermediaStateMixin(LitElement)) {
	static get properties() {
		return {
			currentTime: { type: String, attribute: 'current-time' },
			startDate: { type: String, attribute: 'start-date' },
			endDate: { type: String, attribute: 'end-date' },
			_initialDateToDisplay: { type: String },
			_myActivitiesHref: { type: String, observable: observableTypes.link, rel: rel.myActivities, prime: true },
			_timezoneOffsetMinutes: { type: Number }
		};
	}

	static get styles() {
		return [css`
			:host {
				display: flex;
				justify-content: center;
				margin-top: 10px;
				margin-bottom: 10px;
				flex-direction: column;
			}

			d2l-input-date {
				align-self: center;
			}
		`];
	}

	constructor() {
		super();
		const now = new Date();
		this._timezoneOffsetMinutes = now.getTimezoneOffset();
		this._initialDateToDisplay = now.toISOString();
		this._setDates(new Date());
	}

	static get localizeConfig() {
		return {
			importFunc: async lang => (await import(`../build/langterms/${lang}.js`)).default
		};
	}

	render() {
		return html`
			<d2l-input-date
				label="${this.localize('chooseDate')}"
				value="${ifDefined(this._initialDateToDisplay)}"
				@change="${this._onDateChanged}"
			></d2l-input-date>

			<d2l-w2d-collections
				href="${this._myActivitiesHref}"
				.token="${this.token}"
				?skeleton="${!this._loaded}"
				allow-unclickable-activities
				use-first-name
				group-by-days=14
				overdue-group-by-days=14
				overdue-day-limit=84
				upcoming-week-limit=2
				current-time="${ifDefined(this.currentTime)}"
				start-date="${ifDefined(this.startDate)}"
				end-date="${ifDefined(this.endDate)}"
				user-url="${this.href}"
			></d2l-w2d-collections>
		`;
	}

	_onDateChanged(e) {
		if (e.target.value) {
			this._setDates(new Date(e.target.value));
		}
	}

	_setDates(selectedDate) {
		// The date selector provides us with a datetime of midnight UTC of the selected day - but
		// really, the user thinks they're selecting a datetime of midnight of the selected day in
		// their local timezone. Because of this, we need to add their offset to this datetime so
		// that we're still dealing in UTC datetimes, but that have been shifted by their local
		// offset.
		const localSelectedDate = new Date(selectedDate);
		localSelectedDate.setMinutes(localSelectedDate.getMinutes() + this._timezoneOffsetMinutes);

		// Note that getDay/getDate return the day of the week/month in the local timezone, not in
		// UTC. However, because we've already shifted this Date object by the offset above, the
		// day of the week is what you'd expect here (e.g. if the user selected a Sunday, dayOfWeek
		// will be zero).
		const dayOfWeek = localSelectedDate.getDay();
		const dayOfMonth = localSelectedDate.getDate();
		const beginningOfWeek = new Date(
			localSelectedDate.getFullYear(),
			localSelectedDate.getMonth(),
			dayOfMonth - dayOfWeek
		);
		this.startDate = beginningOfWeek.toISOString();
		this.currentTime = beginningOfWeek.toISOString();

		const endOfWeekAfter = new Date(
			beginningOfWeek.getFullYear(),
			beginningOfWeek.getMonth(),
			beginningOfWeek.getDate() + 13,
			23, 59, 59, 999
		);
		this.endDate = endOfWeekAfter.toISOString();
	}
}

customElements.define('d2l-all-assessments', D2LAllAssessments);

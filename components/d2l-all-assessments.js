import { css, html, LitElement } from 'lit-element';
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
			_myActivitiesHref: { type: String, observable: observableTypes.link, rel: rel.myActivities, prime: true }
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
				value="${this.startDate}"
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
				current-time="${this.currentTime}"
				start-date="${this.startDate}"
				end-date="${this.endDate}"
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
		const dayOfWeek = selectedDate.getDay();
		const beginningOfWeek = new Date(selectedDate.setDate(selectedDate.getDate() - dayOfWeek));
		beginningOfWeek.setHours(0, 0, 0, 0);
		this.startDate = beginningOfWeek.toISOString();
		this.currentTime = beginningOfWeek.toISOString();

		const endOfWeekAfter = new Date(beginningOfWeek.setDate(beginningOfWeek.getDate() + 12));
		endOfWeekAfter.setHours(23, 59, 59, 999);
		this.endDate = endOfWeekAfter.toISOString();
	}
}

customElements.define('d2l-all-assessments', D2LAllAssessments);

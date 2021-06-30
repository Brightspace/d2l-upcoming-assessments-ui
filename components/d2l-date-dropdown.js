import '@polymer/polymer/polymer-legacy.js';
import 'd2l-colors/d2l-colors.js';
import '@polymer/iron-a11y-keys/iron-a11y-keys.js';
import 'd2l-offscreen/d2l-offscreen-shared-styles.js';
import 'd2l-icons/d2l-icon.js';
import 'd2l-icons/tier1-icons.js';
import 'd2l-link/d2l-link.js';
import 'd2l-date-picker/localize-behavior.js';
import 'd2l-date-picker/d2l-date-picker.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { updateStyles } from '@polymer/polymer/lib/mixins/element-mixin.js';
import { useShadow } from '@polymer/polymer/lib/utils/settings.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-date-dropdown">
	<template strip-whitespace="">
		<style>
			:host {
				display: block;
			}

			span {
				padding-right: 7px;
				color: var(--d2l-color-ferrite);
			}

			d2l-link {
				display: flex;
				align-items: center;
			}

			d2l-link:hover {
				text-decoration: none;
			}

			:host(:dir(rtl)) span {
				padding-left: 7px;
				padding-right: 0px;
			}

			.d2l-dropdown-content-pointer {
				position: relative;
				clip: rect(-5px, 21px, 8px, -3px);
				left: calc(50% - 7px);
				z-index: 10000;
				display: inline-block;
				opacity: 0;
				top: -10px;
			}

			@media (min-width: 420px) and (min-height: 420px) {
				:host([opened]) .d2l-dropdown-content-pointer {
					opacity: 1;
					transition-property: opacity, transform;
					transition-duration: 300ms;
					transition-timing-function: ease;
					transform: translateY(10px);
				}
			}

			:host(:dir(rtl)) .d2l-dropdown-content-pointer {
				left: 0;
				right: calc(50% - 7px);
				margin-top: 3px;
			}

			.d2l-dropdown-content-pointer > div {
				background-color: var(--d2l-color-white);
				border: 1px solid var(--d2l-color-mica);
				border-radius: 0.1rem;
				border-right: hidden;
				border-bottom: hidden;
				box-shadow: -4px -4px 12px -5px rgba(86, 90, 92, .2);
				height: 16px;
				width: 16px;
				transform: rotate(45deg);
				-webkit-transform: rotate(45deg);
			}

			:host(:not([opened])) {
				--vaadin-date-picker-overlay: {
					font-family: inherit;
					max-height: 355px;
					margin-top: 0px;
					border-radius: 5px;
					border: 1px solid var(--d2l-color-mica);
					opacity:0;
				}
			}

			:host([opened]) {
				--vaadin-date-picker-overlay: {
					font-family: inherit;
					max-height: 355px;
					margin-top: 0px;
					border-radius: 5px;
					border: 1px solid var(--d2l-color-mica);
					transition-property: opacity, transform;
					transition-duration: 300ms;
					transition-timing-function: ease;
					opacity:1;
					transform: translateY(10px);
				}
			}

			.input {
				height: 1.2rem;
			}
		</style>

		<d2l-date-picker value="{{value}}" locale="[[locale]]" custom-overlay-style="">
			<div class="input">
				<d2l-link href="javascript:void(0);" on-focus="_handleFocus" on-tap="_handleTap">
					<span class="currentPeriod">[[currentPeriodText]]</span>
					<d2l-icon icon="d2l-tier1:chevron-down" aria-hidden="true"></d2l-icon>
				</d2l-link>
				<div class="d2l-dropdown-content-pointer">
					<div></div>
				</div>
			</div>
			<iron-a11y-keys target="[[_target]]" keys="enter" on-keys-pressed="_onEnter"></iron-a11y-keys>
			<iron-a11y-keys target="[[_target]]" keys="up down" on-keys-pressed="_onUpDown"></iron-a11y-keys>
		</d2l-date-picker>
	</template>


</dom-module>`;

document.head.appendChild($_documentContainer.content);

Polymer({
	is: 'd2l-date-dropdown',
	properties: {
		_target: {
			type: Object
		},
		currentPeriodText: {
			type: String
		},
		opened: {
			type: Boolean,
			value: false,
			reflectToAttribute: true
		},
		locale: String,
		value: {
			type: String,
			observer: 'handleValueChanged',
			reflectToAttribute: true
		}
	},
	ready: function() {
		this._target = this.$$('d2l-link');
		// HACK: d2l-date-picker now expects that an input element should be passed in,
		// This is a change in behavior from previously, and should be fixed,
		// But for now we can fix the issue by adding a 'checkValidity' function to the first element
		this.$$('.input').checkValidity = () => true;

		var self = this;

		this.addEventListener('iron-overlay-opened', function() {
			self.opened = true;
			updateStyles();
		});

		this.addEventListener('iron-overlay-canceled', function(e) {
			e.stopPropagation();
		});

		this.addEventListener('iron-overlay-closed', function() {
			self.opened = false;
			updateStyles();
		});
	},
	handleValueChanged: function(value) {
		if (value) {
			var dateInfo = value.split(/\s*-\s*/g);
			var year = dateInfo[0];
			var month = dateInfo[1] - 1;
			var date = dateInfo[2];
			var changedDate = new Date(year, month, date);
			this.fire('d2l-date-dropdown-value-changed', { date: changedDate });
		}
	},
	_onEnter: function(e) {
		this.$$('d2l-date-picker').onEnter(e);
	},
	_onUpDown: function(e) {
		this.$$('d2l-date-picker').onUpDown(e);
	},
	_handleTap: function(e) {
		this.$$('d2l-date-picker')._handleTap(e);
	},
	focus: function() {
		this.$$('d2l-link').focus();
	},
	_handleFocus: function() {
		// in shady DOM the input's "focus" event does not bubble,
		// so no need to fire it
		if (!useShadow) {
			this.dispatchEvent(new CustomEvent(
				'focus',
				{ bubbles: true, composed: false }
			));
		}
	}
});

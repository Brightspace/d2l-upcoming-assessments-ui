import '@polymer/polymer/polymer-legacy.js';
import './d2l-assessments-list-item.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="d2l-assessments-list">
	<template strip-whitespace="">
		<style>
			:host {
				display: block;
				margin-bottom: 25px;
			}

			.date-header {
				background-color: var(--d2l-color-gypsum);
			}
		</style>
		<template is="dom-repeat" items="[[assessmentItems]]">
			<d2l-assessments-list-item assessment-item="[[item]]" flags="[[flags]]">
			</d2l-assessments-list-item>
		</template>
	</template>
	
</dom-module>`;

document.head.appendChild($_documentContainer.content);

Polymer({

	is: 'd2l-assessments-list',

	properties: {
		assessmentItems: {
			type: Array,
			value: function() {
				return [];
			}
		},
		flags: {
			type: Object,
			value: function() {
				return {};
			}
		}
	}

});

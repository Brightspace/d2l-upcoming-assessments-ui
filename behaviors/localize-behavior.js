import 'd2l-localize-behavior/d2l-localize-behavior.js';
import '../build/langterms/ar.js';
import '../build/langterms/de.js';
import '../build/langterms/en.js';
import '../build/langterms/es.js';
import '../build/langterms/fr.js';
import '../build/langterms/ja.js';
import '../build/langterms/ko.js';
import '../build/langterms/nl.js';
import '../build/langterms/pt.js';
import '../build/langterms/sv.js';
import '../build/langterms/tr.js';
import '../build/langterms/zh-TW.js';
import '../build/langterms/zh.js';
window.D2L = window.D2L || {};
window.D2L.UpcomingAssessments = window.D2L.UpcomingAssessments || {};

/*
* @polymerBehavior window.D2L.UpcomingAssessments.LocalizeBehavior
*/
window.D2L.UpcomingAssessments.LocalizeBehaviorImpl = {
	properties: {
		resources: {
			value: function() {
				return {
					'ar': this.ar,
					'de': this.de,
					'en': this.en,
					'es': this.es,
					'fr': this.fr,
					'ja': this.ja,
					'ko': this.ko,
					'nl': this.nl,
					'pt': this.pt,
					'sv': this.sv,
					'tr': this.tr,
					'zh': this.zh,
					'zh-TW': this['zh-TW']
				};
			}
		}
	}
};

/* @polymerBehavior */
window.D2L.UpcomingAssessments.LocalizeBehavior = [
	D2L.PolymerBehaviors.LocalizeBehavior,
	window.D2L.UpcomingAssessments.LocalizeBehaviorImpl,
	window.D2L.UpcomingAssessments.LangArBehavior,
	window.D2L.UpcomingAssessments.LangDeBehavior,
	window.D2L.UpcomingAssessments.LangEnBehavior,
	window.D2L.UpcomingAssessments.LangEsBehavior,
	window.D2L.UpcomingAssessments.LangFrBehavior,
	window.D2L.UpcomingAssessments.LangJaBehavior,
	window.D2L.UpcomingAssessments.LangKoBehavior,
	window.D2L.UpcomingAssessments.LangNlBehavior,
	window.D2L.UpcomingAssessments.LangPtBehavior,
	window.D2L.UpcomingAssessments.LangSvBehavior,
	window.D2L.UpcomingAssessments.LangTrBehavior,
	window.D2L.UpcomingAssessments.LangZhTWBehavior,
	window.D2L.UpcomingAssessments.LangZhBehavior
];

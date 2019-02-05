import '../../behaviors/d2l-upcoming-assessments-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
Polymer({
	is: 'd2l-upcoming-assessments-behavior-consumer',
	behaviors: [
		window.D2L.UpcomingAssessments.UpcomingAssessmentsBehavior
	]
});

import '../../behaviors/date-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
Polymer({
	is: 'date-behavior-consumer',
	behaviors: [
		window.D2L.UpcomingAssessments.DateBehavior
	]
});

// import Events from '../lib/collections';

Meteor.startup(function () {
	Meteor.methods({
		logEvent: function (evLog) {
			Events.insert(evLog);
		}
	});
});
	
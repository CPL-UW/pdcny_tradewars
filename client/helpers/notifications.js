Template.allReadAlerts.helpers({
	readAlerts: function () {
		return Alerts.find({$and: [{"gameCode": Session.get("GameCode")}, {"user": Meteor.userId()}, {"type": "alert"}, {"contents.read": 1}]});
	},

	readRequests: function () {
		return Alerts.find({$and: [{"gameCode": Session.get("GameCode")}, {"user": Meteor.userId()}, {"type": "request"}, {"contents.read": {$ne: 0}}]});
	}
});
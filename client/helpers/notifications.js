Template.allReadAlerts.helpers({
	readAlerts: function () {
		return Alerts.find({$and: [{"gameCode": Session.get("GameCode")}, {"user": Meteor.userId()}, {"type": "alert"}, {"contents.read": 1}]});
	},

	readRequests: function () {
		return Alerts.find({$and: [{"gameCode": Session.get("GameCode")}, {"user": Meteor.userId()}, {"type": "request"}, {"contents.read": {$ne: 0}}]});
	},

	requestResponse: function (id) {
		req = Alerts.findOne({_id: id});
		if (req.read == 1){
			return "accepted.";
		}
		else if (req.read == -1){
			return "rejected.";
		}
		else {
			return "(strangely, ) not responded to!"
		}
	}
});
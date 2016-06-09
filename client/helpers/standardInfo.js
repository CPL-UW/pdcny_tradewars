Template.userInfo.helpers ({
	groupID: function () {
		return Session.get("GroupNo");
	},

	userID: function () {
		return Meteor.user().username;
	}
});

Template.alertsTemp.helpers({
	allAlerts: function () {
		return Alerts.find({$and: [{"gameCode": Session.get("GameCode")}, {"user": Meteor.userId()}, {type: "alert"}, {"contents.read": 0}]});
	}
});

Template.alertsTemp.events({
	'submit .clear-alerts' : function (event) {
		event.preventDefault();
		Meteor.call('raiseAlert', Meteor.userId(), "clearall", Session.get("GameCode"));
	}
});

Template.requestsTemp.helpers({
	allRequests: function () {
		return Alerts.find({$and: [{gameCode: Session.get("GameCode")}, {user: Meteor.userId()}, {type: "request"}, {"contents.read": 0}]});
	}
});

Template.requestsTemp.events({
	"click input[type=submit]": function(e) {
		reqId = $(e.target)[0].form.className;
		request = Alerts.findOne({_id: reqId}).contents;
		acceptance = false;
		if($(e.target).prop("id") == "accept"){
			// console.log("accept");
			e.preventDefault();
			reqResStock = AllStocks.findOne({$and: [{gID: Session.get("GroupNo")}, {gameCode: Session.get("GameCode")}, {item: request["reqRes"]}]});
			if (reqResStock == undefined){
				Meteor.call("raiseAlert", Meteor.userId(), "Your group doesn't have the item you're trying to give! Trade fails", Session.get("GameCode"));
				acceptance = false;
			}
			else if(reqResStock.amount < request["reqAmt"]){
				Meteor.call('raiseAlert', Meteor.userId(), "Your group doesn't have enough of the item you're trying to give! Trade fails", Session.get("GameCode"));
				acceptance = false;
			}
			else{
				Meteor.call('exchangeResources', reqId, Session.get("GameCode"), function(err, result){
					if(err){
						Meteor.call('raiseAlert', Meteor.userId(), "The server's dying man. Sorry", Session.get("GameCode"));
					}
					else {
						Meteor.call('raiseAlert', Meteor.userId(), "Request completed, you have the things you were offered!", Session.get("GameCode"));
					}
				});
				
				acceptance = true;
			}
		}
		else{
			// console.log("reject");
			e.preventDefault();
			acceptance = false;
			// console.log("reject", $(e.target).prop("fNo"));
		}

		if(acceptance == false){
			Meteor.call('raiseAlert', request["requester"].id, "Request rejected/failed.", Session.get("GameCode"));
		}
		else {
			Meteor.call('raiseAlert', request["requester"].id, "Request accepted! Woohoo", Session.get("GameCode"));	
		}
		Meteor.call('readRequest', reqId);
	}
});
// import { Alerts } from '../../lib/collections';

activeTab = new ReactiveVar('stocks-tab'); //Your default tab
groupNameVar = new ReactiveVar('admin');

// Template.userInfo.helpers ({
// 	groupID: function () {
// 		groupNameVar.set(groupNames[Session.get("GroupNo")]);
// 		return groupNameVar.get();
// 	},

// 	userID: function () {
// 		return Meteor.user().username;
// 	}
// });

Template.gameInfo.helpers ({
	// gameTime: function () {
	// 	thisGameAdmin = RunningGames.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"group": "admin"}]});
	// 	if (thisGameAdmin.hasOwnProperty("gameStart")){
	// 		// Session.set("GameSeconds", Math.ceil(((new Date()).getTime() - RunningGames.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"group": "admin"}]}).gameStart) / 1000));
	// 		Meteor.setInterval(function () {
	// 			Session.set("GameSeconds", Math.ceil(((new Date()).getTime() - RunningGames.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"group": "admin"}]}).gameStart) / 1000));
	// 		}, 500);
	// 		return Session.get("GameSeconds");
	// 	}
	// },

	gameYear: function () {
		gameDoc = RunningGames.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"group": "admin"}]});
		if (gameDoc != null)
			return gameDoc.currentYear;
		else
			return "This game doesn't have a year, very strange.";
	}

});

Template.topAlerts.helpers({
	unreadAlerts: function () {
		return Alerts.find({$and: [{"gameCode": Session.get("GameCode")}, {"user": Meteor.userId()}, {type: "alert"}, {"contents.read": 0}]});
	}
});

Template.topAlerts.events({
	'click .readThisAlert': function (e) {
		e.preventDefault();
		// console.log("alert closing butoonn");
		// console.log(e.currentTarget.id);
		Meteor.call('raiseAlert', Meteor.userId(), {"text": "clearOne", "contextKind": "id", "context": e.currentTarget.id}, Session.get("GameCode"), function (err, result) {
			if (err) {
				console.log("failed to read alert");
			}
			else {
				console.log("alert successfully read");
			}
		});
	}
});

Template.alertsTemp.helpers({
	allAlerts: function () {
		return Alerts.find({$and: [{"gameCode": Session.get("GameCode")}, {"user": Meteor.userId()}, {type: "alert"}, {"contents.read": 0}]});
	},

	anyUnreadAlerts: function () {
		console.log(Alerts.find({$and: [{"gameCode": Session.get("GameCode")}, {"user": Meteor.userId()}, {type: "alert"}, {"contents.read": 0}]}).fetch());
		return Alerts.find({$and: [{"gameCode": Session.get("GameCode")}, {"user": Meteor.userId()}, {type: "alert"}, {"contents.read": 0}]}).fetch().length > 0;
	}

});

Template.alertsTemp.events({
	'submit .clear-alerts' : function (event) {
		event.preventDefault();
		Meteor.call('raiseAlert', Meteor.userId(), {"text": "clearAll"}, Session.get("GameCode"));
	}
});

Template.requestsTemp.helpers({
	allRequests: function () {
		return Alerts.find({$and: [{gameCode: Session.get("GameCode")}, {user: Meteor.userId()}, {type: "request"}, {"contents.read": 0}]});
	}
});

Template.requestsTemp.events({
	"click input[type=submit]": function(e) {
		e.preventDefault();
		console.log($(e.target)[0].form.id);
		reqId = $(e.target)[0].form.id;
		request = Alerts.findOne({_id: reqId}).contents;
		acceptance = false;
		alertFn = function (text, urgency, usr = Meteor.userId()) {
			console.log(text + " " + urgency);
			Meteor.call('raiseAlert', usr, {"text": text, "contextKind": "request", "context": reqId}, Session.get("GameCode"), urgency);
		}
		if($(e.target).prop("id") == "accept"){
			// console.log("accept");
			e.preventDefault();
			reqResStock = AllStocks.findOne({$and: [{gID: Session.get("GroupNo")}, {gameCode: Session.get("GameCode")}, {item: request["reqRes"]}]});
			if (reqResStock == undefined){
				alertFn("Your group doesn't have the item you're trying to give! Trade fail *sad trombone*", "danger");
				acceptance = false;
			}
			else if(reqResStock.amount < request["reqAmt"]){
				alertFn("Your group doesn't have enough of the item you're trying to give! Trade fail *sad trombone*", "warning");
				acceptance = false;
			}
			else{
				Meteor.call('exchangeResources', reqId, Session.get("GameCode"), function(err, result){
					if(err){
						alertFn("The server's dying man. Sorry", "danger");
						// Meteor.call('raiseAlert', Meteor.userId(), {"text": "The server's dying man. Sorry", "contextKind": "request", "context": reqId}, Session.get("GameCode"), "danger");
					}
					else {
						alertFn("Request completed, you have the things you were offered!", "success");
						// Meteor.call('raiseAlert', Meteor.userId(), {"text": "Request completed, you have the things you were offered!", "contextKind": "request", "context": reqId}, Session.get("GameCode"), "success");
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
			alertFn("Request completed, you have the things you were offered!", "danger", request["requester"].id);
			// Meteor.call('raiseAlert', request["requester"].id, {"text": "Request rejected/failed.", "contextKind": "request", "context": reqId}, Session.get("GameCode"), "danger");
		}
		else {
			alertFn("Request completed, you have the things you were offered!", "danger", request["requester"].id);
			// Meteor.call('raiseAlert', request["requester"].id, {"text": "Request accepted! Woohoo", "contextKind": "request", "context": reqId}, Session.get("GameCode"), "success");	
		}
		Meteor.call('readRequest', reqId, acceptance);
	}
});
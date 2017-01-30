// import { Alerts } from '../../lib/collections';

activeTab = new ReactiveVar('stocks-tab'); //Your default tab
groupNameVar = new ReactiveVar('admin');
// gameYear = new ReactiveVar('year');
// Sess

Template.gameInfo.helpers ({
	gameYear: function () {
		gameDoc = RunningGames.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"group": "admin"}]});
		year = "";
		if (gameDoc != null)
			year = gameDoc.currentYear;
		else
			year = "This game doesn't have a year, very strange.";
		Session.set("Year", year);
	}

});

Template.topAlerts.helpers({
	unreadAlerts: function () {
		return Alerts.find({$and: [{"gameCode": Session.get("GameCode")}, {"user": Meteor.userId()}, {type: "alert"}, {"contents.read": 0}]});
	},

	contextInfo: function (id) {
		alert = Alerts.findOne({_id: id});
		if (alert.contents.contextKind == "requestFail" || alert.contents.contextKind == "requestSuccess" || alert.contents.contextKind == "requestCreation" || alert.contents.contextKind == "requestReceival") {
			request = Alerts.findOne({_id: alert.contents.context});
			// console.log(request);
			requestedUsername = Meteor.users.findOne({_id: request.user}).username;
			return "Requested " + request.contents.reqAmt + " " + request.contents.reqRes + " of " + requestedUsername + " by " + request.contents.requester.username + " offering " + request.contents.recvAmt + " " + request.contents.recvRes;
		}

		else {
			// console.log(alert);
			return "";
		}
	}
});

Template.yearProgress.helpers({
	yearFraction: function() {
		game = RunningGames.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"group": "admin"}]});
		fr = (game.elapsedTimeYear * 100) / game.yearLength;
		return fr;
	},


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
	},

	'click .notification-tab': function (e) {
		$('#main-tabs a[value="notif-tab"]').tab('show');

		activeTab.set("notif-tab");
		return true;
	}
});

Template.alertsTemp.helpers({
	allAlerts: function () {
		return Alerts.find({$and: [{"gameCode": Session.get("GameCode")}, {"user": Meteor.userId()}, {type: "alert"}, {"contents.read": 0}]});
	},

	anyUnreadAlerts: function () {
		// console.log(Alerts.find({$and: [{"gameCode": Session.get("GameCode")}, {"user": Meteor.userId()}, {type: "alert"}, {"contents.read": 0}]}).fetch());
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
	},

	sentRequests: function () {
		return Alerts.find({$and: [{gameCode: Session.get("GameCode")}, {"contents.requester.id": Meteor.userId()}, {type: "request"}, {"contents.read": 0}]});	
	}
});

Template.requestsTemp.events({
	"click input[type=submit]": function(e) {
		e.preventDefault();
		// console.log($(e.target)[0].form.id);
		reqId = $(e.target)[0].form.id;
		reqLog = Alerts.findOne({_id: reqId});
		request = reqLog.contents;
		acceptance = "false";
		alertFn = function (text, urgency, contextKind = "request", usr = Meteor.userId()) {
			console.log(text + " " + urgency);
			Meteor.call('raiseAlert', usr, {"text": text, "contextKind": contextKind, "context": reqId}, Session.get("GameCode"), urgency);
		}
		gameYear = RunningGames.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"group": "admin"}]}).currentYear;
		

		if($(e.target).prop("id") == "rescind") {
			// eee = e;
			// console.log(eee);	
			// console.log($(e.target)[0].form);
			acceptance = "rescind";
		}
		else {
			// if (validZoneCodes.indexOf(parseInt(e.target.form.zoneCode.value)) == -1 ) {
			// 	alert(" Invalid Zone Code");
			// }
			// else {

			if($(e.target).prop("id") == "accept"){
				if (validZoneCodes.indexOf(parseInt(e.target.form.zoneCode.value)) == -1 ) {
					alert(" Invalid Zone Code");
					acceptance = "invalid";
					e.preventDefault();
				}
				else {
					console.log("accept");
					e.preventDefault();
					reqResStock = AllStocks.findOne({$and: [{gID: Session.get("GroupNo")}, {gameCode: Session.get("GameCode")}, {item: request["reqRes"]}]});
					if (reqResStock == undefined){
						alertFn("Your group doesn't have the item you're trying to give! Trade fail *sad trombone*", "danger", "requestFail");
						acceptance = "false";
					}
					else if(reqResStock.amount < request["reqAmt"]){
						alertFn("Your group doesn't have enough of the item you're trying to give! Trade fail *sad trombone*", "warning", "requestFail");
						acceptance = "false";
					}
					else{
						Meteor.call('exchangeResources', reqId, Session.get("GameCode"), parseInt(e.target.form.zoneCode.value), gameYear, function(err, result){
							if(err){
								alertFn("The server's dying man. Sorry", "danger", "requestFail");
								// Meteor.call('raiseAlert', Meteor.userId(), {"text": "The server's dying man. Sorry", "contextKind": "request", "context": reqId}, Session.get("GameCode"), "danger");
							}
							else {
								alertFn("Request completed, you have the things you were offered!", "success", "requestSuccess");
								// Meteor.call('raiseAlert', Meteor.userId(), {"text": "Request completed, you have the things you were offered!", "contextKind": "request", "context": reqId}, Session.get("GameCode"), "success");
							}
						});
						
						acceptance = "true";
					}
				}
			}
			else{
				// console.log("reject");
				e.preventDefault();
				acceptance = "false";
				// console.log("reject", $(e.target).prop("fNo"));
			}
		}

		if(acceptance == "false"){
			alertFn("Request rejected/failed! :(", "danger", "requestFail" ,request["requester"].id);
			Meteor.call('readRequest', reqId, -1, gameYear);
			// Meteor.call('raiseAlert', request["requester"].id, {"text": "Request rejected/failed.", "contextKind": "request", "context": reqId}, Session.get("GameCode"), "danger");
		}
		else if(acceptance == "true") {
			alertFn("Request completed, you have the things you were offered!", "success", "requestSuccess", request["requester"].id);
			// Meteor.call('readRequest', reqId, acceptance, gameYear);
			// Meteor.call('raiseAlert', request["requester"].id, {"text": "Request accepted! Woohoo", "contextKind": "request", "context": reqId}, Session.get("GameCode"), "success");	
		}
		else if (acceptance == "rescind") {
			Meteor.call('rescindRequest', reqId, Session.get("GameCode"), gameYear);
			alertFn("You have canceled the request!", "danger", "requestSuccess", request["requester"].id);
			alertFn(request["requester"].username + " canceled the request they sent you!", "danger", "requestSuccess", reqLog.user);

		}
	}
});

Template.factoryList.helpers({
	yearLength: function () {
		yl = RunningGames.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"group": "admin"}]}).yearLength / 60000;
		yl = parseInt(yl * 100) / 100;
		return yl;
	},

	factories: function () {
		return Factories.find({$and: [{"gameCode": Session.get("GameCode")}, {"gID": Session.get("GroupNo")}]});
	},

	itemName: function (id) {
		fact = Factories.findOne({_id: id});
		// console.log(fact);
		if (fact.hasOwnProperty("item")) {
			return fact.item;
		}
		else {
			return fact.itemNo;
		}
	}
});
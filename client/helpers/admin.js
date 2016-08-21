// import { RunningGames } from '../../lib/collections';
// import { AllStocks } from '../../lib/collections';

Template.adminDash.events({
	'click .pauseYear': function (event) {
		// console.log(event);
		event.preventDefault();
		console.log("paused");
		Meteor.call("pauseYear", RunningGames.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"group": "admin"}]}));
	},

	'click .skipYear': function (event) {
		// console.log(event);
		event.preventDefault();
		console.log("year skipped");
		Meteor.call("incrementGameYear", RunningGames.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"group": "admin"}]})._id, "AdminSkip");
	}
});

Template.userKicks.helpers({
	allUsers: function () {
		return RunningGames.find({$and: [{gameCode: Session.get("GameCode")}, {player: {$ne: Meteor.userId()}}]});
	},

});

Template.userKicks.events({
	"submit .kickPlayer": function (event) {
		// console.log("trast");
		event.preventDefault();
		console.log("gah"
			);
		if (event.target.player.value != "None"){
			Meteor.call("kickPlayer", Session.get("GameCode"), event.target.player.value, function (err, result){
				if (err){
					console.log("player kicking failed :( ");
				}
				else {
					Meteor.call("raiseAlert", Meteor.userId(), {"text": "Player kicked!", "contextKind": "adminAction", "context": "thisUser"}, Session.get("GameCode"), "success");
				}
			});
		}
	},

	"click .kickAll": function (event) {
		Meteor.call("kickPlayer", Session.get("GameCode"), Meteor.userId(), true, function (err, result){
			if (err){
				console.log("player kicking failed :( ");
			}
			else {
				Meteor.call("raiseAlert", Meteor.userId(), {"text": "All players kicked!", "contextKind": "adminAction", "context": "thisUser"}, Session.get("GameCode"), "success");
			}
		});
	},

	"click .killGame": function (event) {
		Router.go('/');
		Meteor.call("kickPlayer", Session.get("GameCode"), "all", function (err, result){
			if (err){
				console.log("player kicking failed :( ");
				alert("Game ending failed!! Tell somebody, things are awry.")
			}
			else {
				// Meteor.call("raiseAlert", "All players kicked!");
				Router.go("/");
			}
		});

	}		
});

Template.stockEditor.helpers({
	groupStocks: function () {
		return AllStocks.find({gameCode: Session.get("GameCode")});
	},

});

Template.stockEditor.events({
	"submit .stockChange": function (event) {
		event.preventDefault();
		console.log(event.target.newAmount.value + " " + typeof(event.target.newAmount.value));
		if (event.target.newAmount.value != "") {
			amt = parseInt(event.target.newAmount.value);
			Meteor.call("changeStockAmount", event.target.stock.value, amt);
		}
	}
});

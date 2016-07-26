// import { RunningGames } from '../../lib/collections';
// import { AllStocks } from '../../lib/collections';

Template.userKicks.helpers({
	allUsers: function () {
		return RunningGames.find({$and: [{gameCode: Session.get("GameCode")}, {player: {$ne: Meteor.userId()}}]});
	},

});

Template.userKicks.events({
	"submit .kickPlayer": function (event) {
		// console.log("trast");
		event.preventDefault();
		if (event.target.player.value != "None"){
			Meteor.call("kickPlayer", Session.get("GameCode"), event.target.player.value, function (err, result){
				if (err){
					console.log("player kicking failed :( ");
				}
				else {
					Meteor.call("raiseAlert", "Player kicked!");
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
				Meteor.call("raiseAlert", "All players kicked!");
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
		
});

// import { AllStocks } from '../../lib/collections';
// import { RunningGames } from '../../lib/collections';

Template.baseDash.helpers({
	adminGames() {
		// console.log(RunningGames.find({'admin': Meteor.userId()}).fetch());
		return RunningGames.find({$and: [{'player': Meteor.userId()}, {'group': 'admin'}]});
	},
	
	playingGames() {
		return RunningGames.find({$and: [{'player': Meteor.userId()}, {'group': {$ne: 'admin'}}]});
	},
});

Template.baseDash.events({
	'click .host': function(event, instance) {
		event.preventDefault();
		newGameCode = 0;
		Meteor.call('makeNewGame', Meteor.userId(), function(error, result) {
			if(error){
				alert("Error!");
			}
			else{
				newGameCode = result;
				Router.go("/games/" + newGameCode);
			}
		});
	},

	'submit .gameChoice': function(event) {
		event.preventDefault();
		gCode = event.target.gameCode.value;
		Meteor.call('joinGame', gCode, Meteor.userId(), function(err, result) {
			if (err){
				alert("Errorr");
			}
			else {
				// console.log(result);
				if (result == "Invalid game code"){
					alert("That game does not exist");
				}
				else {
					Router.go("/games/" + gCode);
				}
			}
		});
		// }
	}
});

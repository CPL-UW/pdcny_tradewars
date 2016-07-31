// import { AllStocks } from '../../lib/collections';
// import { RunningGames } from '../../lib/collections';

Template.baseDash.helpers({
	adminGames() {
		// console.log(RunningGames.find({'admin': Meteor.userId()}).fetch());
		return RunningGames.find({$and: [{'player': Meteor.userId()}, {'group': 'admin'}, {'status': 'running'}]});
	},
	
	playingGames() {
		return RunningGames.find({$and: [{'player': Meteor.userId()}, {'group': {$ne: 'admin'}}, {'status': 'running'}]});
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

	'submit .hostGame': function(event) {
		event.preventDefault();
		size = event.target.groups.value;
		if (size == ""){
			size = 4;
		}
		Meteor.call('makeNewGame', Meteor.userId(), size, function(err, result) {
			if (err){
				alert("Failed to make new game omaigosh");
			}
			else {
				Router.go("/games/" + result);
			}
		});
		// }
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

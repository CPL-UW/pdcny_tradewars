Template.centralView.helpers ({
	userIsAdmin: function () {
		if (RunningGames.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"player": Meteor.userId()}]}).role == "admin") {
			return true;
		}
		else{
			return false;
		}
	},


	rankedGroups: function () {
		// allGroups = RunningGames.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"group": "admin"}]}).groupNumbers;
		// groupRanks = [];
		// for (g in allGroups) {
		// 	c = 0;
		// 	AllStocks.find({$and: [{gameCode: Session.get("GameCode")}, {gID: Session.get("GroupNo")}]}).map(function (u) {c += (u.price * u.amount)});
		// 	c = (parseInt(c*100)) / 100;
		// 	RunningGames.update({$and: [{"gameCode": Session.get("GameCode")}, {"role": "homebase"}]});
		// 
		// console.log(RunningGames.find(
		// 	{$and: [
		// 		{"gameCode": Session.get("GameCode")}, 
		// 		{"role": "homebase"}
		// 	]}, 
		// 	{sort: 
		// 		{"cash":-1, "marketValue": -1}
		// 	}
		// 	).fetch());
		game = RunningGames.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"role": "admin"}]});
		if (game.status == "running") { 
			sortGrp = {"cash": -1, "marketValue": -1, "points": -1, "rank": 1}; 
		}
		else {
			sortGrp = {"rank": 1};
		}
		return RunningGames.find(
			{$and: [
				{"gameCode": Session.get("GameCode")}, 
				{"role": "homebase"}
			]}, 
			{sort: 
				sortGrp
			}
		);
	}	
});
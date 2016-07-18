Meteor.startup(function () {
	Meteor.methods({
		changeResourcePrice: function (gameCode, group, item, operation, factor){
			if (operation == "divide")
				factor = 1/factor;
			AllStocks.update({$and: [{"item": item}, {"gID": group}, {"gameCode": gameCode}]}, {$mul: {price: factor}});
		},

		newYearEvents: function (gameId, newEvents) {
			gameDoc = RunningGames.findOne({_id: gameId});
			pres = [];
			cres = [];
			if (newEvents == "reset" || newEvents == "all"){
				//reset the earlier things caused
				// if (gameDoc.hasOwnProperty("pollutedResources")) {
				// 	RunningGames.update({_id: gameId}, {$set: {"pollutedResources": null , "coolResources": null} });
				// }
				gameDoc.pollutedResources.forEach(function(r) {
					Meteor.call("changeResourcePrice", r.gameCode, r.group, r.item, "multiply", r.factor);
				});
				gameDoc.coolResources.forEach(function(r) {
					Meteor.call("changeResourcePrice", r.gameCode, r.group, r.item, "divide", r.factor);
				});
				// RunningGames.update({_id: gameId}, {$set: {"pollutedResources": , "coolResources": cres}});
			}

			if (newEvents == "new" || newEvents == "all"){
				for (g in gameDoc.groupNumbers){
					resourcesToAffect = shuffle(gameDoc.cheapRes).slice(2);
					pres.push({"group": gameDoc.groupNumbers[g], "item": resourcesToAffect[0], "factor": 10});
					cres.push({"group": gameDoc.groupNumbers[g], "item": resourcesToAffect[1], "factor": 10});

					pres.forEach(function(r) {
						Meteor.call("changeResourcePrice", r.group, r.item, "divide", r.factor);
					});
					cres.forEach(function(r) {
						Meteor.call("changeResourcePrice", r.group, r.item, "multiply", r.factor);
					});
				}
				RunningGames.update({_id: gameId}, {$set: {"pollutedResources": pres, "coolResources": cres}});
			}
		},

		incrementGameYear: function (gameDocId, requestType, newEvents = "all"){
			RunningGames.update({_id: gameDocId}, {$set: {"elapsedTimeYear": 0}, $inc: {"currentYear": 1}}, function (err, result) {
				if (err){
					console.log("year updation failed! noooooo....");
				}
				else {
					gameDoc = RunningGames.findOne({_id: gameDocId});
					evLog = {
						"timestamp": (new Date()).getTime(),
						"key": "GameYearIncrease",
						"description": requestType,
						"newYearValue": gameDoc.currentYear,
						"gameCode": gameDoc.gameCode
					}
					Meteor.call("logEvent", evLog);
					Meteor.call("newYearEvents", gameDocId, newEvents);
				}
			});
		},

		checkYearStatus: function (requestType) {
			RunningGames.find({$and: [{"group": "admin"}, {"status": "running"}]}).forEach(function (game) {
				if (game.elapsedTimeYear >= game.yearLength){
					Meteor.call("incrementGameYear", game._id, requestType);
				}
			});
		}
	});
});
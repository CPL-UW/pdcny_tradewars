Meteor.startup(function () {
	Meteor.methods({
		changeResourcePrice: function (gameCode, group, item, operation, factor){
			// console.log(factor + " " + gameCode);
			factor = Number(factor);
			// console.log(gameCode + " " + group + " " + item + " " + operation + " " + factor);
			if (operation == "divide"){
				factor = 1/factor;
			}
			// console.log(factor);
			AllStocks.update({$and: [{"itemNo": String(item)}, {"gID": group}, {"gameCode": gameCode}]}, {$mul: {price: factor}});
			///*** Mean should be changed, not price ***///
		},

		newYearEvents: function (gameId, newEvents) {
			gameDoc = RunningGames.findOne({_id: gameId});
			pastPres = []
			pastCres = []
			if (gameDoc.hasOwnProperty("pollutedResources")){
				pastPres = gameDoc.pollutedResources;
				pastCres = gameDoc.coolResources;
			}
			if (newEvents == "reset" || newEvents == "all"){
				// console.log("resetting");
					pastPres.forEach(function(r) {
						// console.log("resetting to increase");
						// console.log(gameDoc.gameCode + " " + r.group + " " + r.item + " " + r.factor);
						if(gameDoc.gameCode != undefined)
							Meteor.call("changeResourcePrice", gameDoc.gameCode, r.group, r.itemNo, "multiply", r.factor);
					});
					pastCres.forEach(function(r) {
						// console.log(gameDoc.gameCode + " " + r.group + " " + r.item + " " + r.factor);
						// console.log("resetting to decrease");
						if(gameDoc.gameCode != undefined)
							Meteor.call("changeResourcePrice", gameDoc.gameCode, r.group, r.itemNo, "divide", r.factor);
					});
				
			}

			if (newEvents == "new" || newEvents == "all"){
				// console.log("new things");
				groupNos = gameDoc.groupNumbers;
				newpres = [];
				newcres = []
				for (g in groupNos){
					// pres = []
					// cres = []
					resourcesToAffect = (shuffle(gameDoc.cheapRes)).slice(2);
					// pres.push({"group": gameDoc.groupNumbers[g], "itemNo": resourcesToAffect[0], "factor": 10});
					// cres.push({"group": gameDoc.groupNumbers[g], "itemNo": resourcesToAffect[1], "factor": 10});
					pres = [{"group": groupNos[g], "itemNo": resourcesToAffect[0], "factor": 10}];
					cres = [{"group": groupNos[g], "itemNo": resourcesToAffect[1], "factor": 10}];
					newpres.push(pres[0]);
					newcres.push(cres[0]);

					pres.forEach(function(r) {
						// console.log("polluting");
						Meteor.call("changeResourcePrice", gameDoc.gameCode, r.group, r.itemNo, "divide", r.factor);
					});
					cres.forEach(function(r) {
						// console.log("making cool");
						Meteor.call("changeResourcePrice", gameDoc.gameCode, r.group, r.itemNo, "multiply", r.factor);
					});
				}
				RunningGames.update({_id: gameId}, {$set: {"pollutedResources": newpres, "coolResources": newcres}});
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
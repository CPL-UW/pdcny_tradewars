Meteor.startup(function () {
	Meteor.methods({
		changeStockPrice: function (stockDoc, factor, newyearmod) {
			newmean = stockDoc.mean * factor;
			AllStocks.update({_id: stockDoc._id}, {$set: {"mean": newmean, "yearmod": newyearmod}});
		},

		newYearEvents: function (gameId, newEvents) {
			gameDoc = RunningGames.findOne({_id: gameId});

			// console.log(gameDoc.gameCode + " new year");
			if (newEvents == "reset" || newEvents == "all"){
					gc = gameDoc.gameCode;
					AllStocks.find({$and: [ {"gameCode": gc}, { 'yearmod.kind': {$in: ["polluted", "cool"]} } ]}).forEach( function (stockDoc) {
					newyearmod = {"kind": "none"};
					factor = 1 / stockDoc.yearmod.modAmount;
					Meteor.call("changeStockPrice", stockDoc, factor, newyearmod);
				});
			}

			gameDoc = RunningGames.findOne({_id: gameId});
			// console.log("between things " + gameDoc.gameCode + " " + newEvents + " " + gameId);

			if (newEvents == "new" || newEvents == "all"){
				// console.log("new things " + gameDoc.gameCode);
				groupNos = gameDoc.groupNumbers;
				for (g in groupNos){
					resourcesToAffect = (shuffle(gameDoc.cheapRes)).slice(2);

					stockDoc = AllStocks.findOne({$and: [{"gID": groupNos[g]}, {"gameCode": gameDoc.gameCode}, {"itemNo": resourcesToAffect[0]}]});
					factor = 0.5;
					newyearmod = {"kind": "polluted", "modAmount": factor, "operation": "multiply"};
					Meteor.call("changeStockPrice", stockDoc, factor, newyearmod);

					stockDoc = AllStocks.findOne({$and: [{"gID": groupNos[g]}, {"gameCode": gameDoc.gameCode}, {"itemNo": resourcesToAffect[1]}]});
					factor = 2;
					newyearmod = {"kind": "cool", "modAmount": factor, "operation": "multiply"};
					Meteor.call("changeStockPrice", stockDoc, factor, newyearmod);
				}
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
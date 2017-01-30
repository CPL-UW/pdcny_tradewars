Meteor.startup(function () {
	Meteor.methods({

		checkYearStatus: function (requestType) {
			RunningGames.find({$and: [{"group": "admin"}, {"status": "running"}]}).forEach(function (game) {
				if (game.elapsedTimeYear >= game.yearLength){
					Meteor.call("incrementGameYear", game._id, requestType);
				}
			});
		},

		giveYearPoints: function (gameCode, year) {
			// maxScore = RunningGames.find({$and: [{"gameCode": gameCode}, {"role": "homebase"}]}, {sort : {"marketValue":-1}}).fetch()[0];

			games = RunningGames.find({$and: [{"gameCode": gameCode}, {"role": "homebase"}, {"cash": {$gt: 0} } ]}, {sort : {"cash":-1, "marketValue": -1}}).fetch();
			allGroups = RunningGames.find({$and: [{"gameCode": gameCode}, {"role": "homebase"}]}).fetch();
			i = 0;
			// award = 0;
			while (i < games.length && i < yearAwards.length){
				RunningGames.update({_id: games[i]._id}, {$inc: {"points": yearAwards[i]}});
				evLog = {
					"timestamp": (new Date()).getTime(),
					"key": "AnnualPointAward",
					"year": year,
					"gameCode": gameCode,
					"group": games[i].group,
					"pointsAwarded": yearAwards[i],
					"allGroups": allGroups
				}
				Meteor.call("logEvent", evLog);
				i = i + 1;
			}
			// RunningGames.update( {$and: [{"gameCode": gameCode}, {"role": "homebase"}]}, {$set: {"cash": 0} }, {multi: true} );
			Meteor.call("resetCashes", gameDoc.gameCode, gameDoc.currentYear);
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
					if (requestType != "NewGameSetup"){
						
						// Meteor.call("cashOutAllResources", gameDoc.gameCode, gameCode.currentYear);
						Meteor.call("giveYearPoints", gameDoc.gameCode, gameDoc.currentYear);
						// Meteor.call("resetCashes", gameDoc.gameCode, gameDoc.currentYear);

					}
				}
			});
		},

		// makeMoney: function (gameCode, group, amount, res){
		// 	stock = AllStocks.findOne({$and: [{"gameCode": gameCode}, {"gID": group}, {"itemNo": res}]});
		// 	cost = stock.price;
		// 	cash = (parseInt(Math.log(amount)*100) * cost) / 100;
		// 	// RunningGames.update({$and: [{"gameCode": gameCode}, {"group": group}, {"role": "homebase"}]}})
		// },

		// cashOutAllResources: function (gameCode, year) {
		// 	Cashes.find({$and: [ 
		// 		{"gameCode": gameCode}, 
		// 		// { "year": year }, 
		// 		{"amount": {$gt: 0}} ]}).forEach( function (cashDoc) {
		// 			if (cashDoc != undefined){
		// 				Meteor.call("makeMoney", cashDoc.gameCode, cashDoc.group, cashDoc.amount, cashDoc.res);
		// 			}
		// 	});

		// },

		resetCashes: function (gameCode, year) {
			Cashes.update({"gameCode": gameCode}, {$set: {"cash":0, "amount": 0, "year": year, "sold": false}}, {multi: true});
			RunningGames.update({$and: [{"gameCode": gameCode}, {"role": "homebase"}]}, {$set: {"cash": 0}}, {multi: true});
			// Meteor.call("giveYearPoints", gameDoc.gameCode, gameDoc.currentYear);
		},

		newYearEvents: function (gameId, newEvents) {
			gameDoc = RunningGames.findOne({_id: gameId});

			// console.log(gameDoc.gameCode + " new year");
			if (newEvents == "reset" || newEvents == "all"){
					gc = gameDoc.gameCode;
					AllStocks.find({$and: [ {"gameCode": gc}, { 'yearmod.kind': {$in: ["polluted", "cool"]} } ]}).forEach( function (stockDoc) {
						if (stockDoc != undefined){
							newyearmod = {"kind": "none"};
							factor = 1 / stockDoc.yearmod.modAmount;
							Meteor.call("changeStockPrice", stockDoc, factor, newyearmod);
						}
				});
			}

			gameDoc = RunningGames.findOne({_id: gameId});
			// console.log("between things " + gameDoc.gameCode + " " + newEvents + " " + gameId);

			if (newEvents == "new" || newEvents == "all"){
				// console.log("new things " + gameDoc.gameCode);
				groupNos = gameDoc.groupNumbers;
				for (g in groupNos){
					resourcesToAffect = (shuffle(gameDoc.cheapRes)).slice(-2);
					

					stockDoc = AllStocks.findOne({$and: [{"gID": groupNos[g]}, {"gameCode": gameDoc.gameCode}, {"itemNo": resourcesToAffect[0]}]});
					factor = 0.5;
					newyearmod = {"kind": "polluted", "modAmount": factor, "operation": "multiply"};
					if (stockDoc != undefined){
						Meteor.call("changeStockPrice", stockDoc, factor, newyearmod);
					}

					stockDoc = AllStocks.findOne({$and: [{"gID": groupNos[g]}, {"gameCode": gameDoc.gameCode}, {"itemNo": resourcesToAffect[1]}]});
					factor = 2;
					newyearmod = {"kind": "cool", "modAmount": factor, "operation": "multiply"};
					if (stockDoc != undefined){
						Meteor.call("changeStockPrice", stockDoc, factor, newyearmod);
					}
				}
			}

			Meteor.call('factoryWorks', gameId);
		},

		factoryWorks: function(gameId) {
			if (RunningGames.findOne({_id: gameId}) == undefined){
				console.log("server's new year functions are messed up, invalid id reaching factory worker");
			}
			else{
				gameDoc = RunningGames.findOne({_id: gameId});
				gameDoc.groupNumbers.forEach(function (gn) {
					if (gn != undefined){
						Factories.find({$and: [{"gameCode": gameDoc.gameCode}, {"gID": gn}]}).forEach(function (f) {
							// console.log(f + " " + f.production);
							if (f != undefined){
								stockDoc = AllStocks.findOne({$and: [
									{"gameCode": gameDoc.gameCode},
									{"gID": gn},
									{"itemNo": f.itemNo},
								]});
								AllStocks.update(
									{ _id: stockDoc._id},
									{$inc: {"amount": f.production}}
								);
								Meteor.call('updateIndividualStock', stockDoc, "NewYearUpdates");
							}
						});
					}
				});
			}
		},

		changeStockPrice: function (stockDoc, factor, newyearmod) {
			newmean = stockDoc.mean * factor;
			AllStocks.update({_id: stockDoc._id}, {$set: {"mean": newmean, "yearmod": newyearmod}});
		},

		pauseYear: function (gameDoc) {
			// console.log(gameDoc);
			if (gameDoc.status == "running"){
				console.log("paused")
				RunningGames.update({"gameCode": gameDoc.gameCode}, {$set: {status: "paused"}}, {multi: true});
				evLog = {
					"timestamp": (new Date()).getTime(),
					"key": "GamePaused",
					"gameCode": gameDoc.gameCode,
				};
				Meteor.call("logEvent", evLog);

			}
			else {
				console.log("running");
				RunningGames.update({"gameCode": gameDoc.gameCode}, {$set: {status: "running"}}, {multi: true});
				evLog = {
					"timestamp": (new Date()).getTime(),
					"key": "GameResumed",
					"gameCode": gameDoc.gameCode,
				};
				Meteor.call("logEvent", evLog);
			}
		}

	});
});
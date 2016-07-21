Meteor.startup(function () {
	Meteor.methods({
		makeNewGame: function (adminID, codeString = "1730", size = 4) {
			//*** generate random 4 character string
			while (RunningGames.findOne({"gameCode": codeString}) != undefined){
				codeString = Math.random().toString(36).substring(2,8);
			}
			// codeString = "1730";
			if (RunningGames.findOne({"gameCode": codeString}) == undefined){
				RunningGames.insert({
					"gameCode": codeString,
					"player": adminID,
					"playerName": Meteor.users.findOne({"_id": adminID}).username,
					"group": "admin",
					"size": size,
					"lastLogin": (new Date()).getTime(),
					"gameStart": (new Date()).getTime(),
					"currentYear": 0,
					"elapsedTimeTotal": 0,
					"elapsedTimeYear": 0,
					"status": "running",
					"yearLength": 600000,
				},
				function (err, result) {
					if (err){
					}
					else {
						Meteor.call("setupNewGameStocks", codeString, size);
						evLog = {
							"timestamp": (new Date()).getTime(),
							"key": "NewGameStart",
							"description": "",
							"gameCode": codeString,
							"size": 4,		//****TODO***//: add dynamicness in number of groups playing
							"admin": adminID
						}
						Meteor.call("logEvent", evLog);
						Meteor.call("basesToGroups", codeString, size);
					}
				});
			}
			// else {
			// 	//*** if this game already exists, generate a new codestring and try again
			// }
			return codeString;
		},

		setupNewGameStocks: function (code, size) {

			//choose cheap resources for the game
			//choose expensive resources for the game
			//feed them into arrays and set it into the corresponding running game document

			//choose four group names

			// for each group
				//shuffle the cheap resources array, and give them factories of descending productivities
				//repeat above for expensive
				//and during each of those, also give them beginning amounts, and insert price and std dev into each stocks document

			thisCheapResInds = (shuffle(choosingArray).slice(size)).map(function (i) { return cheapResInds[i]; });	// looks like [c3, c1, c5, ...]
			thisExpResInds = (shuffle(choosingArray).slice(size)).map(function (i) { return expResInds[i]; });		// looks like [e3, e1, e5, ...]
			groupIndices = (shuffle(choosingArray).slice(size));
			RunningGames.update({$and: [{"gameCode": code}, {"group": "admin"}]}, {$set: {"cheapRes": cheapRes, "expensiveRes": expRes, "groupNumbers": groupIndices}});
			
			for (g in groupIndices){
				thisGrpCheapRes = shuffle(thisCheapResInds);
				thisGrpExpRes = shuffle(thisExpResInds);

				populateStocks = function (resNames, resList, price, amount, mean, stdev) {
					// console.log(resNames + " " + resList);
					for (res in resList){
						// console.log(resList[res]);
						// console.log(res);
						Meteor.call("makeFactory", code, groupIndices[g], resList[res], res + 1);
						AllStocks.insert({
							"gameCode": code,
							"gID": groupIndices[g],
							"groupName": groupNames[groupIndices[g]],
							"itemNo": resList[res],
							"item": resNames[resList[res]],
							"price": price,
							"amount": amount,
							"mean": mean,
							"stdev": stdev
						});
					}
				};
				populateStocks(expRes, thisGrpExpRes, 150, 5, 150, 30);
				populateStocks(cheapRes, thisGrpCheapRes, 50, 10, 50, 15)
			}
		},


		makeFactory: function (gameCode, groupNo, resource, productionRate) {
			Factories.insert({
				"gameCode": gameCode,
				"gID": groupNo,
				"item": resource,
				"production": productionRate,
				"makeTime": (new Date()).getTime(),
				"lastRun": (new Date()).getTime()
			});
		},


		basesToGroups: function (gameCode, size) {
			var i = 0;
			grps = RunningGames.findOne({$and: [{"gameCode": gameCode}, {"group": "admin"}]}).groupNumbers;
			// console.log(grps);
			while (i < size){
				joinerID = Meteor.users.findOne({"username": baseUsers[i]})._id;
				Meteor.call("insertPlayer", gameCode, joinerID, grps[i], "homebase");
				i++;
			}
		}

		
	});
});
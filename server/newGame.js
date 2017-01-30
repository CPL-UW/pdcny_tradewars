Meteor.startup(function () {
	Meteor.methods({
		makeNewGame: function (adminID, size = 4, codeString = "1730") {
			//*** generate random 4 character string
			console.log(size);
			while (RunningGames.findOne({"gameCode": codeString}) != undefined){
				// codeString = Math.random().toString(36).substring(4,8);
				codeString = parseInt(Math.random()*100000).toString();
			}
			// codeString = "1730";
			firstYear = 2253;
			if (RunningGames.findOne({"gameCode": codeString}) == undefined){
				RunningGames.insert({
					"gameCode": codeString,
					"player": adminID,
					"playerName": Meteor.users.findOne({"_id": adminID}).username,
					"group": "admin",
					"role": "admin",
					"size": size,
					"lastLogin": (new Date()).getTime(),
					"gameStart": (new Date()).getTime(),
					"currentYear": firstYear,
					"elapsedTimeTotal": 0,
					"elapsedTimeYear": 0,
					"status": "running",
					"yearLength": 375000,
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
							"size": size,
							"admin": adminID,
							"startingYear": firstYear,
							"contents": RunningGames.findOne({$and: [{"gameCode": codeString}, {"group": "admin"}]})
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

			thisCheapResInds = (shuffle(choosingArray).slice(8 - size)).map(function (i) { return cheapResInds[i]; });	// looks like [c3, c1, c5, ...]
			thisExpResInds = (shuffle(choosingArray).slice(8 - size)).map(function (i) { return expResInds[i]; });		// looks like [e3, e1, e5, ...]
			groupIndices = (shuffle(choosingArray).slice(8 - size));
			RunningGames.update({$and: [{"gameCode": code}, {"group": "admin"}]}, {$set: {"cheapRes": thisCheapResInds, "expensiveRes": thisExpResInds, "groupNumbers": groupIndices}});
			// console.log(size + " " + groupIndices);
			for (g in groupIndices){
				thisGrpCheapRes = shuffle(thisCheapResInds);
				thisGrpExpRes = shuffle(thisExpResInds);

				populateStocks = function (resNames, resList, price, amount, mean, stdev) {
					// console.log(resNames + " " + resList);
					for (res in resList){
						// console.log(resList[res]);
						// console.log(res);
						Meteor.call("makeFactory", code, groupIndices[g], resNames[resList[res]], resList[res], parseInt(parseInt(res) + 1));
						// console.log(res);
						AllStocks.insert({
							"gameCode": code,
							"gID": groupIndices[g],
							"groupName": groupNames[groupIndices[g]],
							"itemNo": resList[res],
							"item": resNames[resList[res]],
							"price": (price * 0.8) + (Math.random() * (price * 0.2)),
							"amount": amount,
							"mean": mean,
							// "stdev": stdev + Math.random() * (stdev/5),
							"stdev": stdev,
							"yearmod": {"kind": "none"}
						});
					}
				};
				populateStocks(expRes, thisGrpExpRes, 150, 15, 750, 70);
				populateStocks(cheapRes, thisGrpCheapRes, 50, 30, 250, 50)
			}

			Meteor.setTimeout(function() { Meteor.call('updateStocks', code) }, 2000);
		},


		makeFactory: function (gameCode, groupNo, resName, resource, productionRate) {
			Factories.insert({
				"gameCode": gameCode,
				"gID": groupNo,
				"item": resName,
				"itemNo": resource,
				"production": productionRate,
				"makeTime": (new Date()).getTime(),
				"lastRun": (new Date()).getTime()
			});
		},

		setupBaseCash: function (gameCode, baseId, group, cRes, eRes, year) {
			defaultCash =  {
				"gameCode": gameCode,
				"user": baseId,
				"group": group,
				"amount": 0,
				"itemPrice": 0,
				"cash": 0,
				"year": year,
				"itemNo": "",
				"item": "",
				"sold": false
			}
			for (res in cRes){
				defaultCash["itemNo"] = cRes[res];
				defaultCash["item"] = cheapRes[cRes[res]];
				Cashes.insert(defaultCash);
			}
			for (res in eRes){
				defaultCash["itemNo"] = eRes[res];
				defaultCash["item"] = expRes[eRes[res]];
				Cashes.insert(defaultCash);
			}
			
		},

		basesToGroups: function (gameCode, size) {
			var i = 0;
			adminGame = RunningGames.findOne({$and: [{"gameCode": gameCode}, {"group": "admin"}]});
			grps = adminGame.groupNumbers;
			// console.log(grps);
			console.log(size == grps.length + " size of game and number of groups");
			while (i < size){
				joinerID = Meteor.users.findOne({"username": baseUsers[grps[i]]})._id;
				Meteor.call("insertPlayer", gameCode, joinerID, grps[i], "homebase", 0);
				Meteor.call("setupBaseCash", gameCode, joinerID, grps[i], adminGame.cheapRes, adminGame.expensiveRes, adminGame.currentYear);
				i++;
			}
			Meteor.call("incrementGameYear", RunningGames.findOne({$and: [{"gameCode": gameCode}, {"group": "admin"}]})._id, "NewGameSetup");
		}

		
	});
});
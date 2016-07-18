// RunningGames = new Mongo.Collection("games");
// AllStocks = new Mongo.Collection("stocks");
// Alerts = new Mongo.Collection("alerts")
// Events = new Mongo.Collection("eventlogs")

// import './d3-random.min.js'
import '../lib/collections.js';
// import RunningGames from '../lib/collections'
// import Alerts from '../lib/collections';
// import AllStocks from '../lib/collections';

resources = ["gold", "wood", "food", "stone"]
groupIDs = ["red_group", "green_group", "pink_group", "blue_group"];

choosingArray = [0, 1, 2, 3, 4, 5, 6, 7]
// groupInds = ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8"]
// groupNames = ["red_group", "green_group", "pink_group", "blue_group", "mystic_group", "orange_group", "turqoise_group", "fuschia_group"];
//expensive resources
expResInds = ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8"]
// expRes = {"e1": "adamantium", "e2":"bombastium", "e3": "kryptonite", "e4": "tiberium", "e5": "unobtainium", "e6": "dilithium", "e7": "neutronium", "e8": "flubber"}
//cheap resources
cheapResInds = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"]
// cheapRes = {"c1": "wood", "c2": "metal", "c3": "coal", "c4": "plastic", "c5": "clay", "c6": "water", "c7": "cats", "c8": "gravity"}

gaussian = function(mean, stdev) {
    var y2;
    var use_last = false;
    return function() {
        var y1;
        if(use_last) {
           y1 = y2;
           use_last = false;
        }
        else {
            var x1, x2, w;
            do {
                 x1 = 2.0 * Math.random() - 1.0;
                 x2 = 2.0 * Math.random() - 1.0;
                 w  = x1 * x1 + x2 * x2;               
            } while( w >= 1.0);
            w = Math.sqrt((-2.0 * Math.log(w))/w);
            y1 = x1 * w;
            y2 = x2 * w;
            use_last = true;
       }

       var retval = mean + stdev * y1;
       if(retval > 0) 
           return retval;
       return -retval;
   }
};

shuffle = function(v){
    for(var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
    return v;
};


date = new Date();
Meteor.startup(function () {
	Meteor.methods({
		
		raiseAlert: function (person, alert, gCode) {
			if (alert == "clearall") {
				Alerts.update({$and: [{"gameCode": gCode}, {"user": person}, {"type": "alert"}]}, {$set: {"contents.read": 1}}, {multi: true});
			}
			else {
				Alerts.insert({"gameCode": gCode, "user": person, "type": "alert", "contents": {"text": alert, "read": 0}});
			}
			// console.log(d3.random.normal(1,10));
		},

		reqTrade : function (gCode, recipient, requester, giveRes, giveAmt, takeRes, takeAmt) {
			// console.log(recipient, giveRes, giveAmt, takeRes, takeAmt);
			/*
			requests should look like:
			"user": requested
			[
				// {text: "blah blah"},
				{requester: },				requester
				{requested resource: },		reqRes
				{requested amount: },		reqAmt
				{receiving resource: },		recvRes
				{receiving amount: },		recvAmt
				{requestNumber: },			reqNo
				{replied: }					replied
			]
			*/
			reqLog = {
				"gameCode": gCode, 
				"user": recipient, 
				"requestedGroup": RunningGames.findOne({$and: [{"gameCode": gCode}, {"player": recipient}]}).group,
				"type": "request",  
				"contents": {
					"requester": {
						"id": requester, 
						"username": Meteor.users.findOne({_id:requester}).username, 
						"group": RunningGames.findOne({$and: [{"gameCode": gCode}, {"player": requester}]}).group
					},
					"reqRes": takeRes, 
					"reqAmt": parseInt(takeAmt), 
					"recvRes": giveRes, 
					"recvAmt": parseInt(giveAmt), 
					"read": 0
				}
			};
			Alerts.insert(reqLog);
			// console.log(reqLog);
			return reqLog;
		},

		exchangeResources: function (reqId, gCode){
			recvGrp = Alerts.findOne({_id: reqId}).requestedGroup;
			request = Alerts.findOne({_id: reqId}).contents;
			reqingGrp = request.requester.group;

			//recvGrp is the one that received the request
			//reqingGrp is the one that sent the request
			//reqRes is the resource that the requester is requesting
			//recvRes is the resource that the requester is giving (received by request recipient)
			finalRequesterRequestedStock = parseInt(
				AllStocks.findOne(
					{$and: [
						{"gameCode": gCode}, 
						{"gID": reqingGrp}, 
						{"item": request["recvRes"]}]
					}).amount) - parseInt(request["recvAmt"]);
			AllStocks.update({$and: [{"gameCode": gCode}, {"gID": reqingGrp}, {"item": request["recvRes"]}]}, {$set: {"amount": finalRequesterRequestedStock}});	
			
			finalRequesterReceivedStock = parseInt(AllStocks.findOne({$and: [{"gameCode": gCode}, {"gID": reqingGrp}, {"item": request["reqRes"]}]}).amount) + parseInt(request["reqAmt"]);
			AllStocks.update({$and: [{"gameCode": gCode}, {"gID": reqingGrp}, {"item": request["reqRes"]}]}, {$set: {"amount": finalRequesterReceivedStock}});
			
			finalReceiverRequestedStock = parseInt(AllStocks.findOne({$and: [{"gameCode": gCode}, {"gID": recvGrp}, {"item": request["recvRes"]}]}).amount) + parseInt(request["recvAmt"]);
			AllStocks.update({$and: [{"gameCode": gCode}, {"gID": recvGrp}, {"item": request["recvRes"]}]}, {$set: {"amount": finalReceiverRequestedStock}});

			finalReceiverReceivedStock = parseInt(AllStocks.findOne({$and: [{"gameCode": gCode}, {"gID": recvGrp}, {"item": request["reqRes"]}]}).amount) - parseInt(request["reqAmt"]);
			AllStocks.update({$and: [{"gameCode": gCode}, {"gID": recvGrp}, {"item": request["reqRes"]}]}, {$set: {"amount": finalReceiverReceivedStock}});
			
			Meteor.call('readRequest', reqId);
		},

		readRequest: function (reqId) {
			Alerts.update({_id: reqId}, {$set: {"contents.read": 1}});
		},

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
					}
				});
			}
			// else {
			// 	//*** if this game already exists, generate a new codestring and try again
			// }
			return codeString;
		},

		makeFactory: function (gameCode, groupNo, productionRate) {
			Factories.insert({
				"gameCode": gameCode,
				"gID": groupNo,
				"production": productionRate
			});
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

		joinGame: function (gCode, joinerID) {
			// gameCode = parseInt(gameCode);
			gameCode = gCode;
			if (RunningGames.findOne({$and: [{"status": {$ne: "killed"}}, {"gameCode": gameCode}]}) == undefined) {
				console.log("undefined "+gameCode);
				return "Invalid game code";
			}
			else{
				game = RunningGames.findOne({$and: [{"gameCode": gameCode}, {"group": "admin"}]});
				grp = "home";

				if (game == undefined){

					groupSizes = game.groupIndices.map(function(gi) {	//group index
						return {"groupIndex": gi, "groupSize": RunningGames.find({$and: [{"gameCode": gameCode}, {"group": gi}]}).fetch().length};
					});
					sortedGroups = groupSizes.sort(function (a, b) {
						return (a.groupSize - b.groupSize);
					});
					grp = sortedGroups[0].groupIndex;

					RunningGames.insert({
						"gameCode": gameCode,
						"player": joinerID,
						"playerName": Meteor.users.findOne({"_id": joinerID}).username,
						"group": grp,

						"lastLogin": (new Date()).getTime()
					});
				}
				else {
					grpNo = game.group;
					Meteor.call('updateGameJoin', gameCode, joinerID);
					return "Game joined";
				}
			}
		},

		updateGameJoin: function (gameCode, player) {
			RunningGames.update({$and: [{"gameCode": gameCode}, {"player": player}]}, {$set: {"lastLogin": (new Date()).getTime()}});
		},

		updateStocks: function (gameCode) {
			newPricefn = gaussian(150, 50);
			console.log(gameCode);
			for (g in groupIDs){
				for (r in resources){
					stock = AllStocks.findOne({$and: [{"gameCode": gameCode}, {"gID": groupIDs[g]}, {"item": resources[r]}]});
					// console.log(g, r, gameCode, stock);
					if (stock != undefined){
						currentPrice = stock.price * 0.8;
						// console.log(currentPrice + 0.2 * newPricefn());
						newPrice = Math.round((currentPrice + 0.2 * newPricefn()), -1);
                        // TODO time lag, history field/column, compute price better...
						AllStocks.update({$and: [{"gameCode": gameCode}, {"gID": groupIDs[g]}, {"item": resources[r]}]}, {$set: {"price": newPrice}});
						
						evLog = {
							"timestamp": (new Date()).getTime(),
							"key": "StockPriceChange",
							"description": "RegularUpdate",
							"gameCode": gameCode,
							"group": groupIDs[g],
							"item": resources[r],
							"price": newPrice
						}
						Meteor.call("logEvent", evLog);
					}
				}
			}
		},

		checkLogins: function () {
			currentTime = (new Date()).getTime();
			// console.log("check");
			recentGames = RunningGames.find({$and: [{status: "running"}, {lastLogin: {$gt: (currentTime - 1800000)}}]}).fetch();
			if (recentGames.length > 0){
				//get the gameCodes of all the games recently logged in to
				recentGameCodes = recentGames.map(function(game) {
					return game.gameCode;
				});
				//filter it out to the unique game codes
				recentGameCodes = recentGameCodes.filter( function(item, i, ar){ 
					return ar.indexOf(item) === i; 
				});
				//update staocks for each of those unique game codes
				recentGameCodes.forEach(function(gCode) {
					Meteor.call('updateStocks', gCode);
				});
			}
			return true;
		},

		updateTimeElapsed: function (timeElapsed) {
			currentTime = (new Date()).getTime();
			RunningGames.update({$and: [{"group": "admin"}, {"status": "running"}]}, {$inc: {"elapsedTimeYear": timeElapsed, "elapsedTimeTotal": timeElapsed}});
			Meteor.call("checkYearStatus", "RegularCheck");
		},

		kickPlayer: function (gCode, playerId = "all", negative = false) {
			if (playerId != "all"){
				if (negative == false){
					if (RunningGames.findOne({$and: [{gameCode: gCode}, {player: playerId}]}) != undefined){
						RunningGames.remove({$and: [{gameCode: gCode}, {player: playerId}]}, {justOne: false})
						return true;
					}
					else {
						return false;
					}
				}
				else {
					RunningGames.remove({$and: [{gameCode: gCode}, {player: {$ne: playerId}}]}, {justOne: false});
					return true;
				}
			}
			else {
				// AllStocks.remove({$and: [{gameCode: gCode}]}, {justOne: false});
				// Alerts.remove({$and: [{gameCode: gCode}]}, {justOne: false});
				// Factories.remove({$and: [{gameCode: gCode}]}, {justOne: false});
				RunningGames.remove({$and: [{gameCode: gCode}, {group: {$ne: "admin"}}]}, {justOne: false});
				RunningGames.update({$and: [{gameCode: gCode}, {group:"admin"}]}, {$set: {status: "killed"}});
				return false;
			}
		}

	});
});

Meteor.setInterval(function () {
	Meteor.call('checkLogins');
}, 120000);

Meteor.setInterval(function () {
	Meteor.call('updateTimeElapsed', 15000);
}, 15000);

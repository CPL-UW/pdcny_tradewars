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

//expensive resources
expResInds = ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8"]
expRes = {"e1": "adamantium", "e2":"bombastium", "e3": "kryptonite", "e4": "tiberium", "e5": "unobtainium", "e6": "dilithium", "e7": "neutronium", "e8": "flubber"}
//cheap resources
cheapResInds = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"]
cheapRes = {"c1": "wood", "c2": "metal", "c3": "coal", "c4": "plastic", "c5": "clay", "c6": "water", "c7": "cats", "c8": "gravity"}

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
}

if (Meteor.isServer) {
	date = new Date();
	Meteor.startup(function () {

		//given a list of resources, choose one at random
		//given a dict of resources : 0, make that random resource 1000
		
		//given a dict of resources and groupID , make a document with that groupID and dict
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
								"gameCode": gameCode,
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

			setupNewGameStocks: function (code, size) {
				for (g in _)

				for (g in groupIDs){
					// print("adding for ", groupIDs[g]);
					for (r in resources){
						// print("adding ", resources[r]);
						AllStocks.insert({
							"gameCode": code,
							"gID": groupIDs[g],
							"item": resources[r],
							"price": 150,
							"amount": 50
						});
					}
				}

			},

			joinGame: function (gCode, joinerID) {
				// gameCode = parseInt(gameCode);
				gameCode = gCode;
				if (RunningGames.findOne({"gameCode": gameCode}) == undefined) {
					console.log("undefined "+gameCode);
					return "Invalid game code";
				}
				else{
					game = RunningGames.findOne({$and: [{"gameCode": gameCode}, {"player": joinerID}]});
					grp = "home";
					if (game == undefined){
						grp = groupIDs[Math.floor(Math.random() * 4)];

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
							console.log(currentPrice + 0.2 * newPricefn());
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
				recentGames = RunningGames.find({lastLogin: {$gt: (currentTime - 1800000)}}).fetch();
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

			incrementGameYear: function (gameDocId, requestType){
				RunningGames.update({_id: gameDocId}, {$set: {"elapsedTimeYear": 0}, $inc: {"currentYear": 1}}, function (err, result) {
					if (err){
						console.log("year updation failed nooo");
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
					}
				});
			},

			checkYearStatus: function (requestType) {
				RunningGames.find({$and: [{"group": "admin"}, {"status": "running"}]}).forEach(function (game) {
					if (game.elapsedTimeYear >= game.yearLength){
						Meteor.call("incrementGameYear", game._id, requestType);
					}
				});
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
					RunningGames.remove({$and: [{gameCode: gCode}]}, {justOne: false});
					AllStocks.remove({$and: [{gameCode: gCode}]}, {justOne: false});
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

}

// import '../lib/collections.js';

choosingArray = [0, 1, 2, 3, 4, 5, 6, 7]
//expensive resources
expResInds = ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8"]
//cheap resources
cheapResInds = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"]

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
		
		raiseAlert: function (person, alert, gCode, urgency = "warning") {
			// console.log(alert);
			// console.log(alert.text + " " + alert.contextKind);
			if (alert.text == "clearAll") {
				Alerts.update({$and: [{"gameCode": gCode}, {"user": person}, {"type": "alert"}]}, {$set: {"contents.read": 1}}, {multi: true});
			}
			else if (alert.text == "clearOne" && alert.contextKind == "id") {
				console.log(alert.context);
				// console.log(Alerts.findOne({_id: alert.context}));
				Alerts.update({_id: alert.context}, {$set: {"contents.read": 1}});
			}
			else {
				alert["urgency"] = urgency;
				alert["read"] = 0;
				Alerts.insert({"gameCode": gCode, "timestamp": (new Date()).getTime(), "user": person, "type": "alert", "contents": alert});
			}
			// console.log(d3.random.normal(1,10));
		},

		zoneValidator: function (zoneCode, gameCode, gameYear, groupNo, userId) {
			// console.log(validZoneCodes + " " + zoneCode + " " + validZoneCodes.indexOf(parseInt(zoneCode)));
			zone = validZoneCodes.indexOf(parseInt(zoneCode));
			if ( zone > -1) {
				console.log("correct zone");
				return 1;
			}
			else{
				console.log("wrong zone");
				return 0;
			}
		},

		reqTrade : function (gCode, 
			recipient, 
			requester, 
			requesterGroup, 
			giveRes, 
			giveAmt, 
			takeRes, 
			takeAmt, 
			zoneCode, 
			gameYear) {
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
			// takeResName = expRes[takeRes];
			// if (takeResName == undefined){
			// 	takeResName = cheapRes[takeRes];
			// }
			// giveResName = expRes[giveRes];
			// if (giveResName == undefined) {
			// 	giveResName = cheapRes[giveRes];
			// }
			// console.log(giveResName + " " + takeResName);
			requestedGroup = RunningGames.findOne({$and: [{"gameCode": gCode}, {"player": recipient}]}).group;
			giveResGiver = AllStocks.findOne({$and: [{"gameCode": gCode}, {"gID": parseInt(requesterGroup)}, {"itemNo": giveRes}]});
			giveResTaker = AllStocks.findOne({$and: [{"gameCode": gCode}, {"gID": parseInt(requestedGroup)}, {"itemNo": giveRes}]});
			takeResGiver = AllStocks.findOne({$and: [{"gameCode": gCode}, {"gID": parseInt(requesterGroup)}, {"itemNo": takeRes}]});
			takeResTaker = AllStocks.findOne({$and: [{"gameCode": gCode}, {"gID": parseInt(requestedGroup)}, {"itemNo": takeRes}]});
			// console.log(giveResGiver + " " + takeResGiver);
			// takeResName = takeRe
			// if (giveResName != undefined && takeResName != undefined){
				reqLog = {
					"gameCode": gCode, 
					"timestamp": (new Date()).getTime(),
					"year": gameYear,
					"user": recipient,
					"username": Meteor.users.findOne({_id: recipient}).username,
					"requestedGroup": requestedGroup,
					"type": "request",
					"zone": zoneCode,
					"contents": {
						"requester": {
							"id": requester, 
							"username": Meteor.users.findOne({_id:requester}).username, 
							"group": requesterGroup
						},
						"reqRes": takeResGiver.item,
						"reqResNo": takeRes, 
						"reqAmt": parseInt(takeAmt),
						"recvRes": giveResGiver.item,
						"recvResNo": giveRes,
						"recvAmt": parseInt(giveAmt),
						"read": 0,
						"reqResRequester": takeResGiver,
						"reqResRecipient": takeResTaker,
						"recvResRequester": giveResGiver,
						"recvResRecipient": giveResTaker,
					}
				};
				insertId = 0;
				Alerts.insert(reqLog);
				insertId = Alerts.findOne(reqLog)._id;
				postedReqLog = Alerts.findOne({_id: insertId});
				evLog = {
					"timestamp": (new Date()).getTime(),
					"key": "TradeRequestSent",
					"reqId": insertId,
					"description": "",
					"gameCode": gCode,
					"player": requester,
					"reqLogContents": postedReqLog,
					"zone": postedReqLog.zone
				}

				Meteor.call("logEvent", evLog)
				// console.log("Making request");
				// console.log(insertId);
				return insertId;
			// }
		},

		rescindRequest: function (reqId, gCode, gameYear) {
			Meteor.call('readRequest', reqId, -2, gameYear);
		},

		exchangeResources: function (reqId, gCode, zoneCode, gameYear){
			reqt = Alerts.findOne({_id: reqId})
			recvGrp = reqt.requestedGroup;
			request = reqt.contents;
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
			
			Meteor.call('readRequest', reqId, 1, gameYear, zoneCode);
			reqt["year"] = gameYear;
			Meteor.call('updateStocks', gCode, "TradeCausedUpdate", reqt);
		},

		readRequest: function (reqId, state = 1, gameYear, zoneCode = 0000) {
			val = 1;
			if (state == -1){
				val = -1;
			}
			else if (state == -2){
				val = -2;
			}
			Alerts.update({_id: reqId}, {$set: {"contents.read": val}});
			
			req = Alerts.findOne({_id: reqId});
			evLog = {
				"timestamp": (new Date()).getTime(),
				"key": "TradeRequestResponded",
				"description": "",
				"gameCode": req.gameCode,
				"year": gameYear,
				"player": req.user,
				"response": state,
				"reqLogContents": req,
				"reqResRequester": AllStocks.findOne({_id: req.contents.reqResRequester}),
				"reqResRecipient": AllStocks.findOne({_id: req.contents.reqResRecipient}),
				"recvResRequester": AllStocks.findOne({_id: req.contents.recvResRequester}),
				"recvResRecipient": AllStocks.findOne({_id: req.contents.recvResRecipient}),
				"zone": zoneCode
			};
			Meteor.call("logEvent", evLog)

		},

		cashOutResource: function (sellRes, sellResName, sellAmount, gameCode, userId, groupNo, gameYear) {
			// db.collection.find({ "fieldToCheck" : { $exists : true, $not : null } });
			// AllStocks.update()
			
			// RunningGames.update({$and: [{"gameCode": gameCode}, {"group": groupNo}, {"role": "homebase"}]}, {$inc: {"cash": Math.log(sellAmount)} } );
			cashDoc = Cashes.findOne({$and: [{"gameCode": gameCode}, {"group": groupNo}, {"res": sellRes}]});
			
			if (cashDoc == undefined) {
				console.log(gameCode + " " + groupNo + " " + sellRes + " cash doc not found while cashing out");
			}
			else {
				stockDoc = AllStocks.findOne( { $and: [{"gameCode": gameCode}, {"gID": groupNo}, {"itemNo": sellRes} ] } );
				AllStocks.update( { stockDoc._id }, {$inc: {"amount": -1 * sellAmount} } );
				Cashes.update({_id: cashDoc._id}, {$inc: {"amount": sellAmount}});
				Meteor.call("updateCash", cashDoc, "CashOut");
			
				// Cashes.update({$and: [{"gameCode": gameCode}, {"group": groupNo}, {"res": sellRes}, {"year": gameYear}]}, {$inc: {"amount": sellAmount}});
				
				evLog = {
					"timestamp": (new Date()).getTime(),
					"key": "CashingOutResources",
					"description": "",
					"gameCode": gameCode,
					"user": userId,
					"year": gameYear,
					"group": groupNo,
					"resource": sellRes,
					"resourceName": sellResName,
					"amount": sellAmount,
					"price": stockDoc.price,
					"stockDoc": stockDoc,
					"cashDoc": cashDoc				
				};
				Meteor.call("logEvent", evLog);

				contextLog = {
					"amount": sellAmount,
					"year": gameYear
				};

				Meteor.call('updateStocks', gameCode, "CashoutUpdate", contextLog);
			}

		},

		insertPlayer: function (gameCode, joinerID, grp, role, cash = -1) {
			grpname = "";
			if (grp >= 0) {
				grpname = groupNames[grp];
			}
			uname = Meteor.users.findOne({"_id": joinerID}).username
			RunningGames.insert({
				"gameCode": gameCode,
				"player": joinerID,
				"playerName": uname,
				"group": grp,
				"groupName": grpname,
				"role": role,
				"lastLogin": (new Date()).getTime(),
				"status": "running",
				"cash": cash
			});

			evLog = {
				"timestamp": (new Date()).getTime(),
				"key": "PlayerJoinsGame",
				"gameCode": gameCode,
				"player": joinerID,
				"group": grp,
				"playername": uname,
				"groupName": grpname,
			};
			Meteor.call("logEvent", evLog);
		},

		joinGame: function (gCode, joinerID) {
			// gameCode = parseInt(gameCode);
			gameCode = gCode;
			if (RunningGames.findOne({$and: [{"status": {$ne: "killed"}}, {"gameCode": gameCode}, {"group": "admin"}]}) == undefined) {
				console.log("undefined "+gameCode);
				return "Invalid game code";
			}
			else{
				playerGame = RunningGames.findOne({$and: [{"gameCode": gameCode}, {"player": joinerID}]});
				grp = "home";
				if (playerGame == undefined){
					game = RunningGames.findOne({$and: [{"gameCode": gameCode}, {"group": "admin"}]});
					groupSizes = game.groupNumbers.map(function(gi) {	//gi = group index
						return {"groupIndex": gi, "groupSize": RunningGames.find({$and: [{"gameCode": gameCode}, {"group": gi}]}).fetch().length};
					});
					sortedGroups = groupSizes.sort(function (a, b) {
						return (a.groupSize - b.groupSize);
					});
					grp = sortedGroups[0].groupIndex;

					Meteor.call("insertPlayer", gCode, joinerID, grp, "regular");
					
				}
				else {
					// grpNo = playerGame.group;
					Meteor.call('updateGameJoin', gameCode, joinerID);
					return "Game joined";
				}
			}
		},

		updateGameJoin: function (gameCode, player) {
			RunningGames.update({$and: [{"gameCode": gameCode}, {"player": player}]}, {$set: {"lastLogin": (new Date()).getTime()}});
			evLog = {
				"timestamp": (new Date()).getTime(),
				"key": "UserLoggedIn",
				"player": player,
				"gameCode": gameCode
			};
			Meteor.call("logEvent", evLog);
		},

		setGroupRanks: function (gameCode) {
			r = 1;
			RunningGames.find({$and: [{"gameCode": gameCode}, {"role": "homebase"}]}, {sort : {marketValue:-1}}).forEach(function (gameDoc) {
				// console.log(r + " " + gameDoc.group);
				if (gameDoc.hasOwnProperty("points")){
					RunningGames.update({_id: gameDoc._id}, {$set: {"rank": r}});
				}
				else{
					RunningGames.update({_id: gameDoc._id}, {$set: {"rank": r, "points": 0}});	
				}
				r += 1;
			});
		},

		updateGroupMarketValue: function (gameCode, group, updateType) {
			c = 0;
			AllStocks.find({$and: [{"gameCode": gameCode}, {"gID": group}]}).map( function (u) { c += (u.price * u.amount) } );
			c = (parseInt(c * 100)) / 100;
			RunningGames.update({$and: [{"gameCode": gameCode}, {"group": group}, {"role": "homebase"}]}, {$set: {"marketValue": c}}, {multi: true});
			evLog = {
				"timestamp": (new Date()).getTime(),
				"key": "StockPriceChange",
				"description": updateType,
				"gameCode": gameCode,
				"group": group,
				"itemNo": "555",
				"newPrice": c
			};
			Meteor.call("logEvent", evLog);

			Meteor.call("setGroupRanks", gameCode);
		},

		updateTotalCash: function (gameCode, group, updateType) {
			c = 0;
			Cashes.find({$and: [{"gameCode": gameCode}, {"group": group}]}).map( function (u) { c += u.cash; } );
			c = parseInt(c * 100) / 100;
			RunningGames.update({$and: [{"gameCode": gameCode}, {"group": group}, {"role": "homebase"}]}, {$set: {cash: c}});
			evLog = {
				"timestamp": (new Date()).getTime(),
				"key": "CashChange",
				"description": updateType,
				"note": "Change of total cash value per group",
				"gameCode": gameCode,
				"group": group,
				// "year": cashDoc.year,
				"resource": "666",
				"cash": c
			};
			Meteor.call("logEvent", evLog);
		},

		changeStockAmount: function (id, newamt) {
			// console.log(id + " " + newamt);
			AllStocks.update({_id: id}, {$set: {amount: newamt}});
		},

		updateIndividualStock: function (stockDoc, updateType, context = {}) {
			oldPrice = stockDoc.price;
			newPrice = stockDoc.mean / (stockDoc.amount + stockDoc.stdev);
			newPrice = parseInt(newPrice * 100) / 100;
			// if (newPrice == oldPrice)
				AllStocks.update({"_id": stockDoc._id}, {$set: {"price": newPrice}});
				evLog = {
					"timestamp": (new Date()).getTime(),
					"key": "StockPriceChange",
					"description": updateType,
					"gameCode": stockDoc.gameCode,
					"group": stockDoc.gID,
					"itemNo": stockDoc.itemNo,
					"oldPrice": oldPrice,
					"newPrice": newPrice,
					"context": context,
					"stockBeforeUpdate": stockDoc,
					"stockAfterUpdate": AllStocks.findOne({"_id": stockDoc._id})
				}

				
				Meteor.call("logEvent", evLog);

				Meteor.call("updateGroupMarketValue", stockDoc.gameCode, stockDoc.gID, updateType);

				Meteor.call("updateCashPrice", stockDoc.gameCode, stockDoc.gID, stockDoc.itemNo, stockDoc.price, updateType);
			// }
			//call function that computes and updates this group's market value
				//which in turn calls a function that compares all groups' market values, and assigns a rank
		},

		updateCashPrice: function (gameCode, group, res, price, updateType) {
			cashDoc = Cashes.findOne({$and: [{"gameCode": gameCode}, {"group": group}, {"res": res}]});
			if (cashDoc == undefined) {
				console.log(gameCode + " " + group + " " + res + " cash doc not found");
			}
			else {
				Cashes.update({_id: cashDoc._id}, {$set: {"resPrice": price}});
				Meteor.call("updateCash", cashDoc, updateType);
			}
		},

		updateCash: function (cashDoc, updateType) {
			cashDoc = Cashes.findOne({_id: cashDoc._id});
			if (cashDoc.amount > 0){
				cashAmt = parseInt((Math.log(cashDoc.amount) * 100) * cashDoc.resPrice)  / 100;
			}
			else{
				cashAmt = 0;
			}
			Cashes.update({_id: cashDoc._id}, {$set: {"cash": cashAmt}});

			evLog = {
				"timestamp": (new Date()).getTime(),
				"key": "CashChange",
				"description": updateType,
				"gameCode": cashDoc.gameCode,
				"group": cashDoc.group,
				"year": cashDoc.year,
				"resource": cashDoc.res,
				"cash": cashAmt
			};
			Meteor.call("logEvent", evLog);

			Meteor.call("updateTotalCash", cashDoc.gameCode, cashDoc.group, updateType);
		},

		updateStocks: function (gameCode, updateType = "RegularUpdate", context = {}) {
			// newPricefn = gaussian(150, 50);
			console.log(gameCode + " stock update");		//** Needs to be rewritten **//
			AllStocks.find({"gameCode": gameCode}).forEach(function (stockDoc) {
				
				Meteor.call("updateIndividualStock", stockDoc, updateType, context);
			});
			///*** MATTHEW TODO: Integrate resource price calculation here ***///
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
					Meteor.call('updateStocks', gCode, "RegularUpdate");
				});
			}
			return true;
		},

		updateTimeElapsed: function (timeElapsed) {
			currentTime = (new Date()).getTime();
			RunningGames.update({$and: [{"group": "admin"}, {"status": "running"}]}, {$inc: {"elapsedTimeYear": timeElapsed, "elapsedTimeTotal": timeElapsed}}, {multi: true});
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
				// RunningGames.remove({$and: [{gameCode: gCode}, {group: {$ne: "admin"}}]}, {justOne: false});
				RunningGames.update({gameCode: gCode}, {$set: {status: "killed"}}, {multi: true});
				return "killed";
			}
		},

		//setup base station users
		setupBaseUsers: function () {
			if (Meteor.users.findOne({"username": baseUsers[0]}) == undefined) {
				for (uname in baseUsers){
					Accounts.createUser({
						username: baseUsers[uname],
						email : "base" + uname + "@bases.com",
						password : basePass,
						profile  : {
						    //publicly visible fields like firstname goes here
						    "firstname": "Base !!1!",
						    "lastname": uname
						}
					});
				}
			}
		}
	});
});

Meteor.startup(function () {
	AllStocks._ensureIndex({ "gameCode": 1});
	AllStocks._ensureIndex({ "gameCode": 1, "gID": 1});
	Alerts._ensureIndex({"gameCode": 1, "user": 1});
	Alerts._ensureIndex({"gameCode": 1, "user": 1, "type": 1});
	RunningGames._ensureIndex({"gameCode": 1, "group": 1});
	RunningGames._ensureIndex({"gameCode": 1, "group": 1, "status": 1});
	Events._ensureIndex({"gameCode": 1, "key": 1});
	
});

Meteor.setTimeout(function() { Meteor.call('setupBaseUsers'); }, 1000);

Meteor.setInterval(function () {
	Meteor.call('checkLogins');
}, 60000);

Meteor.setInterval(function () {
	Meteor.call('updateTimeElapsed', 15000);
}, 5000);

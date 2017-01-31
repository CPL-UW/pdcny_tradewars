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
					"year": gameYear,
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
			if (finalRequesterRequestedStock >= 0){
				AllStocks.update({$and: [{"gameCode": gCode}, {"gID": reqingGrp}, {"item": request["recvRes"]}]}, {$set: {"amount": finalRequesterRequestedStock}});	
			}
			
			finalRequesterReceivedStock = parseInt(AllStocks.findOne({$and: [{"gameCode": gCode}, {"gID": reqingGrp}, {"item": request["reqRes"]}]}).amount) + parseInt(request["reqAmt"]);
			if (finalRequesterReceivedStock >= 0){
				AllStocks.update({$and: [{"gameCode": gCode}, {"gID": reqingGrp}, {"item": request["reqRes"]}]}, {$set: {"amount": finalRequesterReceivedStock}});
			}
			
			finalReceiverRequestedStock = parseInt(AllStocks.findOne({$and: [{"gameCode": gCode}, {"gID": recvGrp}, {"item": request["recvRes"]}]}).amount) + parseInt(request["recvAmt"]);
			if (finalReceiverRequestedStock >= 0){
				AllStocks.update({$and: [{"gameCode": gCode}, {"gID": recvGrp}, {"item": request["recvRes"]}]}, {$set: {"amount": finalReceiverRequestedStock}});
			}

			finalReceiverReceivedStock = parseInt(AllStocks.findOne({$and: [{"gameCode": gCode}, {"gID": recvGrp}, {"item": request["reqRes"]}]}).amount) - parseInt(request["reqAmt"]);
			if (finalReceiverReceivedStock >= 0){
				AllStocks.update({$and: [{"gameCode": gCode}, {"gID": recvGrp}, {"item": request["reqRes"]}]}, {$set: {"amount": finalReceiverReceivedStock}});
			}
			
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
				"reqResRequester": AllStocks.findOne({_id: req.contents.reqResRequester._id}),
				"reqResRecipient": AllStocks.findOne({_id: req.contents.reqResRecipient._id}),
				"recvResRequester": AllStocks.findOne({_id: req.contents.recvResRequester._id}),
				"recvResRecipient": AllStocks.findOne({_id: req.contents.recvResRecipient._id}),
				"zone": zoneCode
			};
			Meteor.call("logEvent", evLog);

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
	Meteor.call('updateTimeElapsed', 5000);
}, 5000);

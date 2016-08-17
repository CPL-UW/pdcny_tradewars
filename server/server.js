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
				console.log(Alerts.findOne({_id: alert.context}));
				Alerts.update({_id: alert.context}, {$set: {"contents.read": 1}});
			}
			else {
				alert["urgency"] = urgency;
				alert["read"] = 0;
				Alerts.insert({"gameCode": gCode, "timestamp": (new Date()).getTime(), "user": person, "type": "alert", "contents": alert});
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
				"timestamp": (new Date()).getTime(),
				"user": recipient,
				"username": Meteor.users.findOne({_id: recipient}).username,
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
			insertId = 0;
			Alerts.insert(reqLog);
			insertId = Alerts.findOne(reqLog)._id;
			evLog = {
				"timestamp": (new Date()).getTime(),
				"key": "TradeRequestSent",
				"description": "",
				"gameCode": gCode,
				"player": requester,
				"contents": reqLog
			}

			Meteor.call("logEvent", evLog)
			
			console.log(insertId);
			return insertId;
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
			
			Meteor.call('readRequest', reqId, true);

			Meteor.call('updateStocks', gCode, "TradeCausedUpdate");
		},

		readRequest: function (reqId, state = true) {
			val = 1;
			if (state == false)
				val = -1;
			Alerts.update({_id: reqId}, {$set: {"contents.read": val}});
			
			req = Alerts.findOne({_id: reqId});
			evLog = {
				"timestamp": (new Date()).getTime(),
				"key": "TradeRequestResponded",
				"description": "",
				"gameCode": req.gameCode,
				"player": req.user,
				"response": state,
				"contents": req
			};
			Meteor.call("logEvent", evLog)

		},

		insertPlayer: function (gameCode, joinerID, grp, role) {
			grpname = "";
			if (grp >= 0) {
				grpname = groupNames[grp];
			}
			RunningGames.insert({
				"gameCode": gameCode,
				"player": joinerID,
				"playerName": Meteor.users.findOne({"_id": joinerID}).username,
				"group": grp,
				"groupName": grpname,
				"role": role,
				"lastLogin": (new Date()).getTime(),
				"status": "running"
			});
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

		updateGroupMarketValue: function (gameCode, group) {
			c = 0;
			AllStocks.find({$and: [{"gameCode": gameCode}, {"gID": group}]}).map( function (u) { c += (u.price * u.amount) } );
			c = (parseInt(c * 100)) / 100;
			RunningGames.update({$and: [{"gameCode": gameCode}, {"group": group}, {"role": "homebase"}]}, {$set: {"marketValue": c}}, {multi: true});
			Meteor.call("setGroupRanks", gameCode);
		},

		changeStockAmount: function (id, newamt) {
			console.log(id + " " + newamt);
			AllStocks.update({_id: id}, {$set: {amount: newamt}});
		},

		updateIndividualStock: function (stockDoc, updateType) {
			newPrice = stockDoc.mean / (stockDoc.amount + stockDoc.stdev);
			newPrice = parseInt(newPrice * 100) / 100;
			AllStocks.update({"_id": stockDoc._id}, {$set: {"price": newPrice}});
			evLog = {
				"timestamp": (new Date()).getTime(),
				"key": "StockPriceChange",
				"description": updateType,
				"gameCode": stockDoc.gameCode,
				"group": stockDoc.gID,
				"itemNo": stockDoc.itemNo,
				"price": newPrice
			}
			Meteor.call("logEvent", evLog);

			Meteor.call("updateGroupMarketValue", stockDoc.gameCode, stockDoc.gID);
			//call function that computes and updates this group's market value
				//which in turn calls a function that compares all groups' market values, and assigns a rank
		},

		updateStocks: function (gameCode, updateType = "RegularUpdate") {
			// newPricefn = gaussian(150, 50);
			console.log(gameCode + " stock update");		//** Needs to be rewritten **//
			AllStocks.find({"gameCode": gameCode}).forEach(function (stockDoc) {
				
				Meteor.call("updateIndividualStock", stockDoc, updateType);
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
					Meteor.call('updateStocks', gCode);
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
			if (Meteor.users.findOne({"username": "group-1-base"}) == undefined) {
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

Meteor.setTimeout(function() { Meteor.call('setupBaseUsers'); }, 1000);

Meteor.setInterval(function () {
	Meteor.call('checkLogins');
}, 60000);

Meteor.setInterval(function () {
	Meteor.call('updateTimeElapsed', 15000);
}, 5000);

Meteor.startup(function () {
	Meteor.methods({
		// cashOutResource: function (sellRes, sellResName, sellAmount, stockDoc, gameCode, userId, groupNo, gameYear) {
		// 	// db.collection.find({ "fieldToCheck" : { $exists : true, $not : null } });
		// 	// AllStocks.update()
			
		// 	// RunningGames.update({$and: [{"gameCode": gameCode}, {"group": groupNo}, {"role": "homebase"}]}, {$inc: {"cash": Math.log(sellAmount)} } );
		// 	cashDoc = Cashes.findOne({$and: [{"gameCode": gameCode}, {"group": groupNo}, {"itemNo": sellRes}]});
			
		// 	if (cashDoc == undefined) {
		// 		console.log(gameCode + " " + groupNo + " " + sellRes + " cash doc not found while cashing out");
		// 		return "Document for this resource at the server end was not found?!";
		// 	}
		// 	else {
		// 		// stockDoc = AllStocks.findOne( { $and: [{"gameCode": gameCode}, {"gID": groupNo}, {"itemNo": sellRes} ] } );
		// 		if (stockDoc.amount < sellAmount){
		// 			return "";
		// 		}
		// 		else {
		// 			AllStocks.update( { "_id": stockDoc._id }, {$inc: {"amount": -1 * sellAmount} } );
		// 		}
				
		// 		Cashes.update({_id: cashDoc._id}, {$inc: {"amount": sellAmount}});
		// 		Meteor.call("updateCash", gameCode, cashDoc, "CashOut");
			
		// 		// Cashes.update({$and: [{"gameCode": gameCode}, {"group": groupNo}, {"res": sellRes}, {"year": gameYear}]}, {$inc: {"amount": sellAmount}});
				
		// 		evLog = {
		// 			"timestamp": (new Date()).getTime(),
		// 			"key": "CashingOutResources",
		// 			"description": "",
		// 			"gameCode": gameCode,
		// 			"user": userId,
		// 			"year": gameYear,
		// 			"group": groupNo,
		// 			"itemNo": sellRes,
		// 			"item": sellResName,
		// 			"amount": sellAmount,
		// 			"price": stockDoc.price,
		// 			"stockDoc": stockDoc,
		// 			"cashDoc": cashDoc				
		// 		};
		// 		Meteor.call("logEvent", evLog);

		// 		contextLog = {
		// 			"amount": sellAmount,
		// 			"year": gameYear
		// 		};

		// 		// Meteor.call('updateStocks', gameCode, "CashoutUpdate", contextLog);

		// 		Meteor.call("updateIndividualStock", )
		// 	}

		// },

		cashOutRes: function (sellRes, sellResName, sellAmount, stockDoc, gameCode, userId, groupNo, gameYear) {
			// db.collection.find({ "fieldToCheck" : { $exists : true, $not : null } });
			// AllStocks.update()
			
			// RunningGames.update({$and: [{"gameCode": gameCode}, {"group": groupNo}, {"role": "homebase"}]}, {$inc: {"cash": Math.log(sellAmount)} } );
			cashDoc = Cashes.findOne({$and: [{"gameCode": gameCode}, {"group": groupNo}, {"itemNo": sellRes}]});
			// console.log(cashDoc);
			if (cashDoc == undefined) {
				console.log(gameCode + " " + groupNo + " " + sellRes + " cash doc not found while cashing out");
				return "Document for this resource at the server end was not found?!";
			}
			else {
				// stockDoc = AllStocks.findOne( { $and: [{"gameCode": gameCode}, {"gID": groupNo}, {"itemNo": sellRes} ] } );
				if (stockDoc.amount < sellAmount){
					return "You don't have enough to sell!";
				}
				else {
					AllStocks.update( { "_id": stockDoc._id }, {$inc: {"amount": -1 * sellAmount} } );
					worth = stockDoc.price * sellAmount;
					Cashes.update({_id: cashDoc._id}, {$set: {"sold": true, "amount": sellAmount, "cash": worth}});
					
					
					
					// Meteor.call("updateCash", gameCode, cashDoc, "CashOut");
				
					// Cashes.update({$and: [{"gameCode": gameCode}, {"group": groupNo}, {"res": sellRes}, {"year": gameYear}]}, {$inc: {"amount": sellAmount}});
					
					evLog = {
						"timestamp": (new Date()).getTime(),
						"key": "CashingOutResource",
						"description": "",
						"gameCode": gameCode,
						"user": userId,
						"year": gameYear,
						"group": groupNo,
						"itemNo": sellRes,
						"item": sellResName,
						"amount": sellAmount,
						"price": stockDoc.price,
						"cash": worth,
						"stockDoc": stockDoc,
						"cashDoc": cashDoc				
					};
					Meteor.call("logEvent", evLog);

					contextLog = {
						"amount": sellAmount,
						"year": gameYear
					};

					// Meteor.call('updateStocks', gameCode, "CashoutUpdate", contextLog);

					Meteor.call("updateIndividualStock", AllStocks.findOne({"_id": stockDoc._id}), "CashoutUpdate", contextLog);
					Meteor.call("updateTotalCash", gameCode, groupNo, "CashoutUpdate", gameYear);
					return "Cashed out!";
				}
			}

		},

		updateTotalCash: function (gameCode, group, updateType, gameYear) {
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
				"year": gameYear,
				"item": "666",
				"itemNo": "666",
				"cash": c
			};
			Meteor.call("logEvent", evLog);
			Meteor.call("setGroupRanks", gameCode);
		},

		// updateCashPrice: function (gameCode, group, res, price, updateType) {
		// 	cashDoc = Cashes.findOne({$and: [{"gameCode": gameCode}, {"group": group}, {"res": res}]});
		// 	if (cashDoc == undefined) {
		// 		console.log(gameCode + " " + group + " " + res + " cash doc not found");
		// 	}
		// 	else {
		// 		Cashes.update({_id: cashDoc._id}, {$set: {"resPrice": price}});
		// 		Meteor.call("updateCash", cashDoc, updateType);
		// 	}
		// },

		// updateCash: function (cashDoc, updateType) {
		// 	//************* ************// see why this was buggy
		// 	// console.log(cashDoc);
		// 	// console.log(cashDoc._id);
		// 	// console.log(Cashes.findOne({"_id": cashDoc._id}));
		// 	cashDoc = Cashes.findOne({"_id": cashDoc._id});
		// 	if (cashDoc.amount > 0){
		// 		cashAmt = parseInt((Math.log(cashDoc.amount) * 100) * cashDoc.itemPrice)  / 100;
		// 	}
		// 	else{
		// 		cashAmt = 0;
		// 	}
		// 	Cashes.update({_id: cashDoc._id}, {$set: {"cash": cashAmt}});

		// 	evLog = {
		// 		"timestamp": (new Date()).getTime(),
		// 		"key": "CashChange",
		// 		"description": updateType,
		// 		"gameCode": cashDoc.gameCode,
		// 		"group": cashDoc.group,
		// 		"year": cashDoc.year,
		// 		"itemNo": cashDoc.itemNo,
		// 		"item": cashDoc.item,
		// 		"cash": cashAmt
		// 	};
		// 	Meteor.call("logEvent", evLog);

		// 	Meteor.call("updateTotalCash", cashDoc.gameCode, cashDoc.group, updateType);
		// },



	});
});
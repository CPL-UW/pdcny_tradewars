Meteor.startup(function () {
	Meteor.methods({
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
					Cashes.update({_id: cashDoc._id}, {$set: {"sold": true, "amount": sellAmount, "cash": worth, "itemPrice": stockDoc.price}});
					
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
						"cashDoc": Cashes.findOne({"_id": cashDoc._id})				
					};
					Meteor.call("logEvent", evLog);

					contextLog = {
						"amount": sellAmount,
						"year": gameYear
					};

					// Meteor.call('updateStocks', gameCode, "CashoutUpdate", contextLog);

					Meteor.call("updateTotalCash", gameCode, groupNo, "CashoutUpdate", gameYear);
					Meteor.call("updateIndividualStock", AllStocks.findOne({"_id": stockDoc._id}), "CashoutUpdate", contextLog);
					
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
		}

	});
});
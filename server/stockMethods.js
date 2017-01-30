Meteor.startup(function () {
	Meteor.methods({
		setGroupRanks: function (gameCode) {
			r = 1;
			RunningGames.find({$and: [{"gameCode": gameCode}, {"role": "homebase"}]}, {sort : {"points": -1, "cash": -1, "marketValue": -1}}).forEach(function (gameDoc) {
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

		updateGroupMarketValue: function (gameCode, group, updateType, context) {
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
				"item": "555",
				"newPrice": c
			};
			Meteor.call("logEvent", evLog);

			Meteor.call("setGroupRanks", gameCode);
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
					"item": stockDoc.item,
					"oldPrice": oldPrice,
					"newPrice": newPrice,
					"context": context
					// "stockBeforeUpdate": stockDoc,
					// "stockAfterUpdate": AllStocks.findOne({"_id": stockDoc._id})
				}

				
				Meteor.call("logEvent", evLog);

				Meteor.call("updateGroupMarketValue", stockDoc.gameCode, stockDoc.gID, updateType, context);

			// Meteor.call("updateCashPrice", stockDoc.gameCode, stockDoc.gID, stockDoc.itemNo, stockDoc.price, updateType);
			// }
			//call function that computes and updates this group's market value
			//which in turn calls a function that compares all groups' market values, and assigns a rank
		},

		updateStocks: function (gameCode, updateType = "RegularUpdate", context = {}) {
			// newPricefn = gaussian(150, 50);
			console.log(gameCode + " stock update");		//** Needs to be rewritten **//
			AllStocks.find({"gameCode": gameCode}).forEach(function (stockDoc) {
				
				Meteor.call("updateIndividualStock", stockDoc, updateType, context);
			});
			///*** MATTHEW TODO: Integrate resource price calculation here ***///
		}

	});
});
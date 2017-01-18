// import Events from '../lib/collections';

// evLog = {
// 	"timestamp": (new Date()).getTime(),
// 	"key": "StockPriceChange",
// 	"description": "RegularUpdate",
//
// 	"gameCode": gameCode,
// 	"group": groupIDs[g],
// 	"item": resources[r],
// 	"price": newPrice
// }

// evLog = {
// 	"timestamp": (new Date()).getTime(),
// 	"key": "NewGameStart",
// 	"description": "",
// 	"gameCode": gameCode,
// 	"size": 4,
// 	"admin": adminID
// }

// evLog = {
// 		"timestamp": (new Date()).getTime(),
// 		"key": "GameYearIncrease",
// 		"description": "RegularUpdate",
// 		"lastYear": game.year,
// 		"newYear": year,
// 		"gameCode": gameCode
// 	}

// evLog = {
// 	"timestamp": (new Date()).getTime(),
// 	"key": "TradeRequestSent",
//	"reqId": reqLog._id,
// 	"description": "",
// 	"gameCode": gCode,
// 	"player": requester,
// 	"contents": reqLog 			--year added
// }

// evLog = {
// 	"timestamp": (new Date()).getTime(),
// 	"key": "TradeRequestResponded",
// 	"description": "",
// 	"gameCode": req.gameCode,
// 	"player": req.user,
// 	"response": state,
// 	"contents": req 			--year added
// };

//keys: StockPriceChange, NewGameStart, TradeRequestSent, TradeRequestResponded

Meteor.startup(function () {
	Meteor.methods({
		logEvent: function (evLog) {
			Events.insert(evLog);
		}
	});
});
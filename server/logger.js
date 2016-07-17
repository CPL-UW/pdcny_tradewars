// import Events from '../lib/collections';

// evLog = {
// 	"timestamp": (new Date()).getTime(),
// 	"key": "StockPriceChange",
// 	"description": "RegularUpdate",
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
// 		"key": "GameYearChange",
// 		"description": "RegularUpdate",
// 		"lastYear": game.year,
// 		"newYear": year,
// 		"gameCode": gameCode
// 	}

//keys: StockPriceChange, NewGameStart

Meteor.startup(function () {
	Meteor.methods({
		logEvent: function (evLog) {
			Events.insert(evLog);
		}
	});
});
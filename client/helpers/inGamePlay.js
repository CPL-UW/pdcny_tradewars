// import AllStocks from '../../lib/collections';
// import RunningGames from '../../lib/collections';

Template.stockInfo.helpers ({
	resources: function () {
		// return AllStocks.findOne({gID: groupID}).market;
		// console.log("stockin");
		if (Session.get("GroupNo") == "admin"){
			return AllStocks.find({gameCode: Session.get("GameCode")});	
		}
		else if (Session.get("GroupNo") != "none"){
			return AllStocks.find({$and: [{gID: Session.get("GroupNo")}, {gameCode: Session.get("GameCode")}]});
		}
	},

	totalValue: function () {
		// mapfn = function () {emit(this.gID, (this.amount * this.price))}
		// reducefn = function (gID, vals) {return Array.sum(vals)};
		// AllStocks.mapReduce(mapfn, reducefn, {out: "mapeg", query: {$and: [{gameCode: "1730"}, {gID: "g4"}]}});
		// return mapeg.findOne.value;
		// AllStocks.find()
		c = 0;
		AllStocks.find({$and: [{gameCode: Session.get("GameCode")}, {gID: Session.get("GroupNo")}]}).map(function (u) {c += (u.price * u.amount)});
		c = (parseInt(c*100)) / 100;
		return c;
	},

	stockFeatureShow: function (feature) {
		if (Session.get("GroupNo") == "admin"){
			return true;
		}
		else if (feature = 'price' && baseUsers.indexOf(Meteor.user().username) != -1) {
			return true;
		}
		else {
			return false;
		}
	},

	isHighlighted: function (resNo) {
		if (Session.get("StockChartItem") == resNo) {
			return "highlightedStock";
		}
		else{
			return "";
		}
	},

	coolCheck: function (kind) {
		return kind == "cool";
	},

	pollutedCheck: function (kind) {
		return kind == "polluted";
	}


});

Template.stockInfo.events({
	'click .viewPriceGraph': function(e) {
		e.preventDefault();
		console.log(e.currentTarget.attributes.value.value);
		Session.set("StockChartItem", e.currentTarget.attributes.value.value);
	}
 });

Template.playerView.helpers({
	thisIsBase: function () {
		return baseUsers.indexOf(Meteor.user().username) != -1;
	}
});

Template.playerView.events({
	'click .view-tabs': function (e) {
		// e.preventDefault();
		console.log(e.currentTarget.attributes.value.value);
		activeTab.set(e.currentTarget.attributes.value.value);
		return true;
	}
});

Template.yearInfo.helpers({
	annualResource: function (type) {
		return AllStocks.find({$and: [{"gameCode": Session.get("GameCode")}, {"gID": Session.get("GroupNo")}, {"yearmod.kind": type}]});
	}
});

Template.trade.helpers({
	otherUsers: function () {
		///playername not in baseusers  , {{"playerName": }} 
		return RunningGames.find({$and: [{gameCode: Session.get("GameCode")}, {player: {$ne: Meteor.userId()}}, {"playerName": {$nin: baseUsers}} , {group: {$nin: ["admin", Session.get("GroupNo")]}}]});

	},

	givingResources: function () {
		return AllStocks.find({$and: [{"gameCode": Session.get("GameCode")}, {"gID": Session.get("GroupNo")}, {"amount": {$gt: 0}}] }, {"item": 1, "amount": 1, "itemNo": 1});
	},

	allResources: function () {
		ar = AllStocks.find({$and: [{"gameCode": Session.get("GameCode")}, {"amount": {$gt: 0}}]}, {"item": 1, "amount": 1, "itemNo": 1}).fetch();
		distinctArray = _.uniq(ar, false, function(d) {return d.item});
		distinctValues = _.pluck(distinctArray, 'item');
		ar = distinctValues.map(function (x){return {"item": x}});
		// console.log(distinctArray);
		return distinctArray;
	}

});

Template.trade.events({
	"submit .trade": function (event) {
		// console.log("trast");
		event.preventDefault();

		var checkAvailability = function(res, amt) {
			// console.log(res);
			resStocks = AllStocks.find({$and: [{"gameCode": Session.get("GameCode")}, {"gID": Session.get("GroupNo")}, {"itemNo": res}, {"amount": {$gte: parseInt(amt)}}]}).fetch();
			a = parseInt(resStocks.length);
			// console.log(resStocks[0]);
			if (a > 0){
				// console.log("tru");
				return true;
			}
			else {
				// console.log("fal");
				return false;
			}
		}

		var getResName = function (res) {
			// console.log(res + " ");
			resStock = AllStocks.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"gID": Session.get("GroupNo")}, {"itemNo": res}]});
			// console.log(resStock)
			return resStock.item;
		}

		gameYear = RunningGames.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"group": "admin"}]}).currentYear;

		clearForm = function (e) {
			e.target.giveAmount.value = "";
			e.target.requestAmount.value = "";
		}
		validZone = false;
		// validZone = true;
		zoneCode = parseInt(event.target.zoneCode.value);

		if (event.target.Recipient.value == "") {
			$("input[name=Recipient]").focus();
		}
		else if (event.target.giveAmount.value == ""){
			$("input[name=giveAmount]").focus();
		}
		else if (event.target.requestAmount.value == "") {
			$("input[name=requestAmount]").focus();
		}
		else if (validZoneCodes.indexOf(zoneCode) == -1){
			alert("invalid zone code");
			$("input[name=zoneCode]").focus();	
		}
		else {
			if (checkAvailability(event.target.GivingResource.value, event.target.giveAmount.value) ){
				// giveResName = getResName(event.target.GivingResource.value);
				// takeResName = getResName(event.target.TakingResource.value);
				Meteor.call('reqTrade', 
					Session.get("GameCode"), 
					event.target.Recipient.value, 
					Meteor.userId(), 
					Session.get("GroupNo"),
					event.target.GivingResource.value, 
					// giveResName, 
					event.target.giveAmount.value, 
					event.target.TakingResource.value, 
					// takeResName, 
					event.target.requestAmount.value, zoneCode,
					gameYear, function (error, result){
					if (error){
						console.log("faaaaiiil");
						Meteor.call('raiseAlert', Meteor.userId(), {"text": "Request sending failed due to server's fault. The machines are rising against us, run.", "contextKind": "serverError", "context": "server"}, Session.get("GameCode"), "danger");
						$(document).scrollTop( $("#alertsAtTop").offset().top );
						clearForm(event);
					}
					else {
						Meteor.call('raiseAlert', Meteor.userId(), {"text": "Sent Request", "contextKind": "requestCreation", "context": result}, Session.get("GameCode"), "success");
						Meteor.call('raiseAlert', event.target.Recipient.value, {"text": "Request received!", "contextKind": "requestReceival", "context": result}, Session.get("GameCode"), "warning");
						$(document).scrollTop( $("#alertsAtTop").offset().top );
						clearForm(event);
					}
				});
			}
			else{
				Meteor.call('raiseAlert', Meteor.userId(), {"text": "Request sending failed – probably not enough resource", "contextKind": "userError", "context": "thisUser"}, Session.get("GameCode"), "danger");
				event.target.giveAmount.value = "";
				$("input[name=giveAmount]").focus();
				$(document).scrollTop( $("#alertsAtTop").offset().top );
			}
		}
	}
});

Template.cashOut.helpers({
	availableResources: function () {
		return AllStocks.find({$and: [{"gameCode": Session.get("GameCode")}, {"gID": Session.get("GroupNo")}, {"amount": {$gt: 0}}] }, {"item": 1, "amount": 1, "itemNo": 1});
	},

	teamCash: function () {
		game = RunningGames.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"group": Session.get("GroupNo")}, {"role": "homebase"}]});
		// console.log(game);
		if (game.cash != undefined){
			// console.log("true");
			c = RunningGames.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"group": Session.get("GroupNo")}, {"role": "homebase"}]}).cash;
		}
		else {
			// console.log("false");
			c = 0;
		}
		// c = "0";
		console.log(c);
		return c;
	}
});

Template.cashOut.events({
	"submit .selling": function (event) {
		event.preventDefault();
		var checkAvailability = function(res, amt) {
			// console.log(res);
			resStocks = AllStocks.find({$and: [{"gameCode": Session.get("GameCode")}, {"gID": Session.get("GroupNo")}, {"itemNo": res}, {"amount": {$gte: parseInt(amt)}}]}).fetch();
			a = parseInt(resStocks.length);
			// console.log(resStocks[0]);
			if (a > 0){
				// console.log("tru");
				return true;
			}
			else {
				// console.log("fal");
				return false;
			}
		}

		var getResName = function (res) {
			// console.log(res + " ");
			resStock = AllStocks.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"gID": Session.get("GroupNo")}, {"itemNo": res}]});
			// console.log(resStock)
			return resStock.item;
		}

		if (event.target.sellResource.value == "") {
			$("input[name=sellResource]").focus();
		}
		else if (event.target.sellAmount.value == ""){
			$("input[name=sellAmount]").focus();
		}
		else {
			gameYear = RunningGames.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"group": "admin"}]}).currentYear;

			if (checkAvailability(event.target.sellResource.value, event.target.sellAmount.value)) {
				Meteor.call('cashOutResource', 
					event.target.sellResource.value, 
					getResName(event.target.sellResource.value), 
					parseInt(event.target.sellAmount.value), 
					Session.get("GameCode"), 
					Meteor.userId(), Session.get("GroupNo"), gameYear, 
					function (err, res) {
						if (err) {
							console.log(err);
							alert("Cash out failed at server end");
						}
						else {
							event.target.sellAmount.value = "";
						}
					}
				);
			}
			else {
				alert("Are you trying to sell more than you have? That wouldn't work.")
			}

		}
	}
});










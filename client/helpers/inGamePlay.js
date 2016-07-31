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
		return c;
	},

	groupNameFn: function (val) {
		return (groupNameVar.get() == val);
	}

});

Template.yearInfo.helpers({
	annualResource: function (type) {
		return AllStocks.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"gID": Session.get("GroupNo")}, {"yearmod.kind": type}]}).item;
	}
});


Template.trade.helpers({
	otherUsers: function () {
		return RunningGames.find({$and: [{gameCode: Session.get("GameCode")}, {player: {$ne: Meteor.userId()}}, {group: {$nin: ["admin", Session.get("GroupNo")]}}]});

	},

	givingResources: function () {
		return AllStocks.find({$and: [{"gameCode": Session.get("GameCode")}, {"gID": Session.get("GroupNo")}, {"amount": {$gt: 0}}] }, {"item": 1, "amount": 1});
	},

	allResources: function () {
		ar = AllStocks.find({$and: [{"gameCode": Session.get("GameCode")}, {"amount": {$gt: 0}}]}, {"item": 1}).fetch();
		distinctArray = _.uniq(ar, false, function(d) {return d.item});
		distinctValues = _.pluck(distinctArray, 'item');
		ar = distinctValues.map(function (x){return {"item": x}});
		return ar;
	}

});

Template.trade.events({
	"submit .trade": function (event) {
		// console.log("trast");
		event.preventDefault();
		var checkAvailability = function(res, amt) {
			a = parseInt(AllStocks.find({$and: [{"gameCode": Session.get("GameCode")}, {"gID": Session.get("GroupNo")}, {"item": res}, {"amount": {$gte: parseInt(amt)}}]}).fetch().length);
			// console.log(a != 0);
			if (a > 0){
				// console.log("tru");
				return true;
			}
			else {
				// console.log("fal");
				return false;
			}
		}

		if (checkAvailability(event.target.GivingResource.value, event.target.giveAmount.value)){
			// console.log(event.target.Recipient.value, Meteor.userId(), event.target.GivingResource.value, event.target.giveAmount.value, event.target.TakingResource.value, event.target.requestAmount.value);
			// console.log(event.target.Recipient.value);
			Meteor.call('reqTrade', Session.get("GameCode"), event.target.Recipient.value, Meteor.userId(), event.target.GivingResource.value, event.target.giveAmount.value, event.target.TakingResource.value, event.target.requestAmount.value, function (error, result){
				if (error){
					Meteor.call('raiseAlert', Meteor.userId(), "Request sending failed due to server's fault. Find the owners of the internets and shout at them.", Session.get("GameCode"));
				}
				else {
					Meteor.call('raiseAlert', Meteor.userId(), "Sent Request", Session.get("GameCode"));
				}
			});
		}
		else{
			Meteor.call('raiseAlert', Meteor.userId(), "Request sending failed – probably not enough resource", Session.get("GameCode"));
		}			
	}
});


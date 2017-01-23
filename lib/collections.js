// import { Mongo } from 'meteor/mongo'

// export const RunningGames = new Mongo.Collection("games");
// export const AllStocks = new Mongo.Collection("stocks");
// export const Alerts = new Mongo.Collection("alerts")
// export const Events = new Mongo.Collection("eventlogs")

RunningGames = new Mongo.Collection("games");
AllStocks = new Mongo.Collection("stocks");
Alerts = new Mongo.Collection("alerts")
Events = new Mongo.Collection("eventlogs")
Factories = new Mongo.Collection("factories")

// export default RunningGames = new Mongo.Collection("games");
// export default AllStocks = new Mongo.Collection("stocks");
// export default Alerts = new Mongo.Collection("alerts")
// export default Events = new Mongo.Collection("eventlogs")


// export default RunningGames;
// export default AllStocks;
// export default Alerts;
// export default Events;

// expRes = {"e1": "adamantium", "e2":"bombastium", "e3": "kryptonite", "e4": "tiberium", "e5": "unobtainium", "e6": "dilithium", "e7": "neutronium", "e8": "flubber"}
expRes = {"e1": "gold", "e2":"silver", "e3": "platinum", "e4": "diamond", "e5": "iridium", "e6": "ruby", "e7": "sapphire", "e8": "pearl"};
// cheapRes = {"c1": "wood", "c2": "metal", "c3": "coal", "c4": "plastic", "c5": "clay", "c6": "water", "c7": "cats", "c8": "gravity"}
cheapRes = {"c1": "wood", "c2": "water", "c3": "food", "c4": "coal", "c5": "cats", "c6": "stone", "c7": "oil", "c8": "cotton"};
groupNames = ["white-group", "red-group", "green-group", "pink-group", "blue-group", "yellow-group", "orange-group", "turqoise-group", "fuschia-group"];
// groupNames = ["white-group-0", "red-group-1", "green-group-2", "pink-group-3", "blue-group-4", "yellow-group-5", "orange-group-6", "turqoise-group-7", "fuschia-group-8"];


// setTimeout(setInterval(Meteor.call('checkLogins'), 120000), 7000);
baseUsers = ["white-group-base", "red-group-base", "green-group-base", "pink-group-base", "blue-group-base", "yellow-group-base", "orange-group-base", "turqoise-group-base", "fuschia-group-base"];

// oldBaseUsers = ["group-0-base","group-1-base", "group-2-base", "group-3-base", "group-4-base", "group-5-base", "group-6-base", "group-7-base", "group-8-base"];
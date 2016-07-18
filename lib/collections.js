import { Mongo } from 'meteor/mongo'

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

expRes = {"e1": "adamantium", "e2":"bombastium", "e3": "kryptonite", "e4": "tiberium", "e5": "unobtainium", "e6": "dilithium", "e7": "neutronium", "e8": "flubber"}
cheapRes = {"c1": "wood", "c2": "metal", "c3": "coal", "c4": "plastic", "c5": "clay", "c6": "water", "c7": "cats", "c8": "gravity"}
groupNames = ["red_group", "green_group", "pink_group", "blue_group", "mystic_group", "orange_group", "turqoise_group", "fuschia_group"];


// setTimeout(setInterval(Meteor.call('checkLogins'), 120000), 7000);
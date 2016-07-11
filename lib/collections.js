import { Mongo } from 'meteor/mongo'

// export const RunningGames = new Mongo.Collection("games");
// export const AllStocks = new Mongo.Collection("stocks");
// export const Alerts = new Mongo.Collection("alerts")
// export const Events = new Mongo.Collection("eventlogs")

RunningGames = new Mongo.Collection("games");
AllStocks = new Mongo.Collection("stocks");
Alerts = new Mongo.Collection("alerts")
Events = new Mongo.Collection("eventlogs")

// export default RunningGames = new Mongo.Collection("games");
// export default AllStocks = new Mongo.Collection("stocks");
// export default Alerts = new Mongo.Collection("alerts")
// export default Events = new Mongo.Collection("eventlogs")


// export default RunningGames;
// export default AllStocks;
// export default Alerts;
// export default Events;


// setTimeout(setInterval(Meteor.call('checkLogins'), 120000), 7000);
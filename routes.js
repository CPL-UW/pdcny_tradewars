// RunningGames = new Mongo.Collection("games");
// AllStocks = new Mongo.Collection("stocks");

// import RunningGames from './lib/collections';

Router.route('/', function() {
	console.log("home");
	this.render('Home');
	Session.set("GameCode", 0);
	Session.set("GroupNo", "home");

});

Router.route('/games/:gameCode', function () {
		// setSession = function (gCode, group, role) {
		// 	Session.set("GameCode", gCode);
		// 	Session.set("GroupNo", group);
		// 	Session.set("Role", role);
		// }
		// var gameCode = parseInt(this.params.gameCode);
		var gameCode = this.params.gameCode;
		role = "none";
		group = "none";
		game = RunningGames.findOne({$and: [{"gameCode": gameCode}, {"player": Meteor.userId()}] });
		//does this game exist
		if (game != undefined) {
			group = game.group;
			// console.log(group);  // **this is being called a lot of times, need to figure this out
			if (group == "admin"){
				//is this user an admin
				role = "adminDash";
			}
			else {
				//is this user a normal player
				role = "userDash";
			}
			// setSession(gameCode, group, role);
			// if (Session.get("GameCode") != gameCode || Session.get("GroupNo") != group){
			// 	console.log("session setting");
			Session.set("GameCode", gameCode);
			Session.set("GroupNo", group);
			Session.set("Role", role);
			// }
			// Session.set("GameCode", "1730");
			// Session.set("GroupNo", "red_group");
			// Session.set("Role", "userDash");

		}
		else {
			// console.log("nothing found");
			gameCode = 0;
		}
		if (gameCode == 0) {
			// alert("Not in this game");
			Router.go("/");
		}
		
		else {
			console.log(role);
			this.render(role, {data: {'gCode': gameCode, 'groupNo': group, 'role': role}});
			// console.log(d3.random.normal(1,10));
			// routerObj = this;
			// Meteor.call('updateGameJoin', gameCode, Meteor.userId(), function (err, result) {
			// 	if (err){
			// 		alert("We aren't able to log to the server that you're trying to join the game. Please tell somebody?");
			// 		// Router.go("/");
			// 	}
			// 	else{
			// 		// routerObj.render(role);
			// 	}
			// });
			// this.next();

		}
	}
);

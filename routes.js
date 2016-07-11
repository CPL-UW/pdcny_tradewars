// RunningGames = new Mongo.Collection("games");
// AllStocks = new Mongo.Collection("stocks");

// import RunningGames from './lib/collections';

Router.route('/', function() {
	this.render('Home');
	Session.set("GameCode", 0);
	Session.set("GroupNo", "home");
});

Router.route('/games/:gameCode', function () {
		setSession = function (gCode, group, role) {
			Session.set("GameCode", gCode);
			Session.set("GroupNo", group);
			Session.set("Role", role);
		}
		// var gameCode = parseInt(this.params.gameCode);
		var gameCode = this.params.gameCode;
		role = "none";
		group = "none";
		game = RunningGames.findOne({$and: [{"gameCode": gameCode}, {"player": Meteor.userId()}] });
		//does this game exist
		if (game != undefined) {
			group = game.group;
			// console.log(group);   **this is being called a lot of times, need to figure this out
			if (group == "admin"){
				//is this user an admin
				role = "adminDash";
			}
			else {
				//is this user a normal player
				role = "userDash";
			}
			setSession(gameCode, group, role);
		}
		else {
			// console.log("nothing found");
			gameCode = 0;
		}
		if (Session.get("GameCode") == 0) {
			// alert("Not in this game");
			Router.go("/");
		}
		
		else {
			// console.log(Session.get("Role"));
			this.render(Session.get("Role"));
			// console.log(d3.random.normal(1,10));
			Meteor.call('updateGameJoin', Session.get("GameCode"), Meteor.userId());

		}
	}
);

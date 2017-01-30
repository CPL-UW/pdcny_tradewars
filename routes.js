// RunningGames = new Mongo.Collection("games");
// AllStocks = new Mongo.Collection("stocks");

// import RunningGames from './lib/collections';

Router.route('/', function() {
	// console.log("home");
	this.render('Home');
	Session.set("GameCode", 0);
	Session.set("GroupNo", "home");
	Session.set("Role", "none");
	Session.set("GameSeconds", 0);
	Session.set("GroupRole", "");
	Session.set("Year", 0);

});

Router.route('/games/:gameCode', function () {
		var gameCode = this.params.gameCode;
		role = "none";
		group = "none";
		game = RunningGames.findOne({$and: [{"gameCode": gameCode}, {"player": Meteor.userId()}, {"status": {$ne: "killed"}}] });
		

		//does this game exist
		if (game != undefined) {
			group = game.group;
			// console.log(group);  // **this is being called a lot of times, need to figure this out
			// console.log(game.role);
			if (group == "admin"){
				//is this user an admin
				role = "adminDash";
			}
			else {
				//is this user a normal player
				role = "userDash";
			}
			
			if (game.status != "running" && game.role != "admin"){
				gameCode = 0;
			}
			else {
				Session.set("GameCode", gameCode);
				Session.set("GroupNo", group);
				Session.set("Role", role);
				Session.set("GroupRole", game.role);
				Session.set("Year", 0);
			}
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
			// console.log(role);
			this.render(role, {data: {'gCode': gameCode, 'groupNo': group, 'role': role}});
		}
	}
);

Router.route('/games/:gameCode/cv', function () {
	var gameCode = this.params.gameCode;
	Session.set("GameCode", gameCode);
	this.render('leaderBoard');
});
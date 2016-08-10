// Template.body.rendered = function () {
	// Session.set("GameCode", "1730");
	// Session.set("GroupNo", "red_group");
	// Session.set("Role", "userDash");

// }

Template.body.helpers ({
	username: function () {
		return Meteor.user().username;
	}

	// sessionSetter: function () {
	// }
});

Template.body.events ({
	'click .logOut': function () {
		// console.log("logging out?");
		AccountsTemplates.logout();
		Router.go('/');
	}
});

Template.navigationBar.helpers({
	username: function () {
		return Meteor.user().username;
	},

	gameView: function () {
		return Session.get("GameCode") != "0";
	},

	gamecode: function () {
		return Session.get("GameCode");
	},

	group: function () {
		if (Session.get("GroupNo") == "admin"){
			return "You're an admin, Harry!";
		}
		else {
			console.log(Session.get("GroupNo"));
			return groupNames[Session.get("GroupNo")];
		}
	},

	gameYear: function () {
		gameDoc = RunningGames.findOne({$and: [{"gameCode": Session.get("GameCode")}, {"group": "admin"}]});
		if (gameDoc != null)
			return gameDoc.currentYear;
		else
			return "This game doesn't have a year, very strange.";
	}
});

Template.navigationBar.events({
	'click .homeButton': function () {
		Router.go('/');
	},

	'click .logOut': function () {
		// console.log("logging out?");
		AccountsTemplates.logout();
		Router.go('/');
	}
});

Template.hello.helpers({
	counter: function () {
		return Session.get('counter');
	}
});

Template.hello.events({
	'click button': function () {
		// increment the counter when button is clicked
		Session.set('counter', Session.get('counter') + 1);
	}
});

Template.userDash.rendered = function () {
	Meteor.call('updateGameJoin', Session.get("GameCode"), Meteor.userId(), function (err, result) {
		if (err){
			alert("We aren't able to log to the server that you're trying to join the game. Please tell somebody?");
			// Router.go("/");
		}
	});
}

Template.userDash.helpers({
	activeTab: function(tab){
        return (activeTab.get() == tab);
	},

	thisIsBase: function () {
		return baseUsers.indexOf(Meteor.user().username) != -1;
	}
});
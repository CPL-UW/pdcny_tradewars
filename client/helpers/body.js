// Template.body.rendered = function () {
	// Session.set("GameCode", "1730");
	// Session.set("GroupNo", "red_group");
	// Session.set("Role", "userDash");

// }

Template.body.helpers ({
	username: function () {
		return Meteor.user().username;
	},

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

// Template.adminDash.rendered = function () {
// 	console.log("temp" + this.data);
// 	// this.render(role, {data: {'gCode': gameCode, 'groupNo': group, 'role': role}});
// 	Session.set("GameCode", this.gCode);
// 	Session.set("GroupNo", this.group);
// 	Session.set("Role", this.role);
// }
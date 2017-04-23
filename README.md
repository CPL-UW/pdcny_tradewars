# Lead Caravan

### Enabling admin

Look at lib/secrets.js. The bossUsername user is the one who gets access to making new games, and modify the games (and also access to the leaderboard). You need to sign up a user with that username, and make a test game. That should set up the base station users as well.

### Seeing the base station view

The usernames are group-1-base, group-2-base, ...
Log in with that username, and use the basepass password in the secrets document. This should show you the price of each of the stocks in the group's market, and their history stock view as well.

### Seeing the leaderboard

If you're logged in to the username who's an admin for a game, go to that admin's game page (/<gamecode>), and then go to /<gamecode>/cv to look at it! For instance, if the gamecode is 1730, http://localhost:3000/games/1730/cv should show the leaderboard. For some reason directly going to the /cv url fails. So go to /games/1730 first. And then add /cv to the url. That'll generally work.

### Running it all

Install meteor. Go into the directory (pdcny_tradewars/) and run meteor. Sometimes it fails the first time cause the setup run order isn't set up very well, but stopping it (ctrl + c) and running it again should work.
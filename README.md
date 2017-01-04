# Lead Caravan

## Enabling base users

If you don't have a file called secrets.js, make any file in the lib/ folder and store a password string in a variable called basePass (basePass = <'something'>). 

### Seeing the base station view

The usernames are group-1-base, group-2-base, ...
Log in with that username, and use the password in the secrets document. This should show you the price of each of the stocks in the group's market, and their history stock view as well.

### Seeing the leaderboard

If you're logged in to the username who's an admin for a game, go to that admin's game page (/<gamecode>), and got to /<gamecode>/cv to look at it! For instance, if the gamecode is 1730, http://localhost:3000/games/1730/cv should show the leaderboard.

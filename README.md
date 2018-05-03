# “MagicMatrix" Bot

MagicMatrix is a bot built with NodeJS for the [Matrix](http://www.matrix.org) chat system based on [hello-matrix-bot](https://gitlab.com/argit/hello-matrix-bot/)

Tested on Windows 7 and Linux Ubuntu 16.04 LTS with NodeJS v8.11.1 and NPM v5.6.0

# Installation

Clone the repo
```
git clone https://github.com/charlesparvin/magic-matrix-bot.git
cd magic-matrix-bot
```
Install all dependancies
```
npm install
```
Create and edit the config file
```
cp matrix-bot-config.example.js matrix-bot-config.js
nano matrix-bot-config.js # or whatever editor you prefer
```
Create the local SQLite3 database (and install sqlite3 first if needed)
```
chmod +x createdb.sh
./createdb.sh
```
Then start the bot
```
npm start
```

# Bot Features

As usual, `!help` will display all relevant commands within your Matrix channel.


## Card features

Display cards in the chatroom (this is based on the mtg.io SDK, I'll change it to use Scryfall's API soon)
```
!card Black Lotus
```
Cards get cached in the localstorage folder. If there is a problem with a cached card you can clear it with `!clear cache`

## Stat-tracking features

You can log your Quick Constructed runs with the following commands, to keep track of how much gold you won or lost or your average/median number of wins

```
!qc             View your current stats
!qc add <X>     Add a run with X wins
!qc undo        Remove last run saved
```

And in a similar way, your draft runs :

```
!qd             View your current stats
!qd add <X>     Add a run with X wins
!qd undo        Remove last run saved
```
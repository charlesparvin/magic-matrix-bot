# “MagicMatrix" Bot

MagicMatrix is a bot meant to help MTG players (and specifically MTG Arena) using the [Matrix](http://www.matrix.org) chat system 

It's built with NodeJS, the code is based on [hello-matrix-bot](https://gitlab.com/argit/hello-matrix-bot/) and it has been successfully tested on Windows 7 and Linux Ubuntu 16.04 LTS with NodeJS v8.11.1 and NPM v5.6.0

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

Display cards in the chatroom, by default limited to sets available in MTG Arena (configurable in `matrix-bot-config.js`), but std/modern/all prefixes can let you search any card you want. By default (check `matrix-bot-config.js`) duplicate names will get filtered, with the most recent version being shown.
```
!card <partial name for a MTGA card>
!card std <partial name for a MODERN card>
!card modern <partial name for a MODERN card>
!card all <partial name for ANY card>
```
Cards' images get cached in the localStorage folder. If there is a problem with a cached card you can clear it with `!clear cache`

## Stat-tracking features

You can log your Quick Constructed runs with the following commands, to keep track of how much gold you won or lost or your average/median number of wins

```
!qc             View your current stats
!qc add <X>     Add a run with X wins
!qc undo        Remove last run saved
!qc view <X>    View your last X runs (default 10)
```

## Draft features

Still under construction!
```
!pack <set_acronym>     Generate a 15-card booster pack for that set
```
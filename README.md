# “MagicMatrix" Bot

MagicMatrix is a bot built with NodeJS for the [Matrix](http://www.matrix.org) chat system based on [hello-matrix-bot](https://gitlab.com/argit/hello-matrix-bot/)

# Installation

Clone the repo
```
git clone https://github.com/charlesparvin/magic-matrix-bot.git
```
Install all dependancies
```
npm install
```
Then copy `matrix-bot-config.example.js` to `matrix-bot-config.js` and fill all the relevant fields in it
Create the local SQLite3 database (or install sqlite3 first if needed)
```
./create_databases.sh
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

## Stats features

You can log your Quick Constructed runs with the following commands


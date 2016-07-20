'use strict';

const TelegramBot = require('node-telegram-bot-api');
const messages = require('./../common/messages');
const Pokeio = require('pokemon-go-node-api');

let bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: process.env.NODE_ENV !== `production`
});

if (process.env.NODE_ENV === `production`)
  bot.setWebHook(`https://pokemongomapbot.herokuapp.com/${bot.token}`);
else
  bot.setWebHook(``);

bot.getMe().then(me => {
  console.log(`I'm ${me.first_name}, my ID is ${me.id} and username is ${me.username}`);
});

bot.on('start', message => {
  bot.sendMessage(message.chat.id, messages.START);
});

bot.on('help', message => {
  bot.sendMessage(message.chat.id, messages.HELP);
});


bot.on('myLocation', message => {
  bot.sendMessage(message.chat.id, messages.TODO);
});

bot.on('nearbyPokemon', (args, message) => {
  bot.sendMessage(message.chat.id, args);
});

bot.on('message', message => {
  bot.sendMessage(message.chat.id, messages.WRONG);
});



module.exports = bot;

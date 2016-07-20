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

bot.onText(/\/start/, message => {
  bot.sendMessage(message.chat.id, messages.START);
});

bot.onText(/\/help/, message => {
  bot.sendMessage(message.chat.id, messages.HELP);
});


bot.on('location', message => {
  bot.sendMessage(message.chat.id, message.location.longitude + ' ' + message.location.latitude);
});

bot.onText(/\/nearbyPokemon (.+)/, (message, match) => {
  bot.sendMessage(message.chat.id, match[1]);
});

bot.on('message', message => {
  console.log(message);
  if(message.entities || message.location)
    return;
  bot.sendMessage(message.chat.id, messages.HELP);
});


module.exports = bot;

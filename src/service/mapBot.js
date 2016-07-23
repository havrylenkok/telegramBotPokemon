'use strict';

const TelegramBot = require('node-telegram-bot-api');
const messages = require('./../common/messages');
const pokemonFinder = require('./pokemonFinder');

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
  bot.sendMessage(message.chat.id, messages.HELP);
});

bot.onText(/\/help/, message => {
  bot.sendMessage(message.chat.id, messages.HELP);
});

bot.on('location', message => {
  pokemonWildSender(`${message.location.latitude}, ${message.location.longitude}`, message.chat.id);
});

bot.onText(/\/nearpoke (.+)/, (message, match) => {
  console.log(`Looking for ${match[1]} via command`);
  pokemonWildSender(match[1], message.chat.id);
});

bot.onText(/\/nearpoke$/, (message) => {
  bot.sendMessage(message.chat.id, messages.HELP);
});

bot.onText(/\/mayspawn (.+)/, (message, match) => {
  pokemonNearbySender(match[1], message.chat.id);
});

bot.on('message', message => {
  console.log(message);
  if (message.entities || message.location)
    return;
  bot.sendMessage(message.chat.id, messages.HELP);
});

function pokemonWildSender(location, chatId) {
  pokemonFinder.getWildPokemon(location, (err, list) => {
    if (err) {
      console.log(err);
      bot.sendMessage(chatId, messages.ERROR);
      return;
    }
    pokemonFinder.getWildString(list, (err, string) => {
      if (err) {
        console.log(err);
        bot.sendMessage(chatId, messages.ERROR);
        return;
      }
      bot.sendMessage(chatId, string);
    });
  });
}

function pokemonNearbySender(location, chatId) {
  pokemonFinder.getNearbyPokemon(location, (err, list) => {
    if (err) {
      console.log(err);
      bot.sendMessage(chatId, messages.ERROR);
      return;
    }
    pokemonFinder.getNearbyString(list, (err, string) => {
      if (err) {
        console.log(err);
        bot.sendMessage(chatId, messages.ERROR);
        return;
      }
      bot.sendMessage(chatId, string);
    });
  });
}

module.exports = bot;

'use strict';

let Pokeio = require('pokemon-go-node-api');
const messages = require('./../common/messages');

let emptyListCounter = 0;
let errorCounter = 0;
let reinitProcess = false;

function initPokeIo(callback) {
  let username = process.env.PGO_USERNAME || 'USER';
  let password = process.env.PGO_PASSWORD || 'PASS';
  let provider = process.env.PGO_PROVIDER || 'google';

  let location = {
    type: 'name',
    name: 'Kiev',
  };

  Pokeio.init(username, password, location, provider, function (err) {
    if (err) {
      return errorHandler(err, callback);
    }
    return callback(null, Pokeio);
  });
}

function getPokemon(whatNeeded, locationName, callback) {
  let pokemonList = [];

  let location = {
    type: 'name',
    name: locationName,
  };

  Pokeio.SetLocation(location, (err, coords) => {
    if (err) {
      return errorHandler(err, callback);
    }
    console.log(`Searching for location: ${coords.latitude}, ${coords.longitude}`);
    Pokeio.Heartbeat(function (err, hb) {
      if (err) {
        return errorHandler(err, callback);
      }

      for (let i = hb.cells.length - 1; i >= 0; i--) {
        switch (whatNeeded) {
          case 'wild':
            if (hb.cells[i].WildPokemon) {
              for (let j = 0; j < hb.cells[i].WildPokemon.length; j++) {
                pokemonList.push({
                  pokemon: Pokeio.pokemonlist[parseInt(hb.cells[i].WildPokemon[j].pokemon.PokemonId) - 1],
                  lat: hb.cells[i].WildPokemon[j].Latitude,
                  long: hb.cells[i].WildPokemon[j].Longitude,
                  timeLeft: hb.cells[i].WildPokemon[j].TimeTillHiddenMs,
                  userLocation: coords,
                });
              }
            }
            break;
          case 'nearby':
            if (hb.cells[i].NearbyPokemon[0]) {
              pokemonList.push({
                pokemon: Pokeio.pokemonlist[parseInt(hb.cells[i].NearbyPokemon[0].PokedexNumber) - 1],
                distance: hb.cells[i].NearbyPokemon[0].DistanceMeters.toString(),
              });
            }
            break;
        }
      }
      console.log(`Answer: ${pokemonList.length}`);
      return callback(null, pokemonList);
    });
  });
}

function getWildPokemon(locationName, callback) {
  getPokemon('wild', locationName, callback);
}

function getNearbyPokemon(locationName, callback) {
  getPokemon('nearby', locationName, callback);
}

function getNearbyString(pokemonList, callback) {
  let pokemonString = `List of pokemon that may spawn near location:\n\n`;
  if (pokemonList.length === 0) {
    incrementEmptyListCounter();
    pokemonString = messages.NO_POKEMON;
  } else {
    pokemonList.forEach(each => {
      pokemonString += `${each.pokemon.name} in ${each.distance} m.\n`;
    });
  }
  if (callback) {
    return callback(null, pokemonString)
  } else {
    return pokemonString;
  }
}

function getWildString(pokemonList, callback) {
  let googleMapsEndpoint = `https://www.google.com.ua/maps/dir/`;
  let pokemonString = `List of spawned pokemon:\n\n`;
  if (pokemonList.length === 0) {
    incrementEmptyListCounter();
    pokemonString = messages.NO_POKEMON;
  } else {
    pokemonList.forEach(each => {
      pokemonString += `${each.pokemon.name}. Despawns in ${each.timeLeft / 1000 } sec.\n`;
      pokemonString += `Google Maps: ${googleMapsEndpoint}${each.lat},${each.long}/${each.userLocation.latitude},${each.userLocation.longitude}\n`;
    });
  }
  if (callback) {
    return callback(null, pokemonString)
  } else {
    return pokemonString;
  }
}

function reInitPokeIo() {
  console.log(`REINITTING POKEIO. Something probably is wrong`);
  if (reinitProcess)
    return;
  reinitProcess = true;
  setTimeout(() => {
    Pokeio = new Pokeio.Pokeio();
    initPokeIo((err, pokeIo) => {
      if (err)
        return err;
      Pokeio = require('pokemon-go-node-api');
    });
    reinitProcess = false;
  }, 2000);
}

function errorHandler(err, callback) {
  errorCounter++;
  if (errorCounter > 10) {
    reInitPokeIo();
    errorCounter = 0;
  }
  callback(err);
}

function incrementEmptyListCounter() {
  emptyListCounter++;
  if (emptyListCounter > 50) {
    reInitPokeIo();
    emptyListCounter = 0;
  }
}

module.exports = {
  getNearbyPokemon,
  getNearbyString,
  getWildPokemon,
  getWildString,
  initPokeIo,
};

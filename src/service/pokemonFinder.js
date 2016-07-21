'use strict';

const Pokeio = require('pokemon-go-node-api');
const messages = require('./../common/messages');

function initPokeIo(callback) {
  let username = process.env.PGO_USERNAME || 'USER';
  let password = process.env.PGO_PASSWORD || 'PASS';
  let provider = process.env.PGO_PROVIDER || 'google';

  let location = {
    type: 'name',
    name: 'Kiev',
  };

  Pokeio.init(username, password, location, provider, function (err) {
    if (err) return callback(err);
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
      return callback(err);
    }
    console.log(`Searching for location: ${coords.latitude}, ${coords.longitude}`);
    Pokeio.Heartbeat(function (err, hb) {
      if (err) return callback(err);

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

module.exports = {
  getNearbyPokemon,
  getNearbyString,
  getWildPokemon,
  getWildString,
  initPokeIo,
};

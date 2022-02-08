'use strict';

const deezerSecrets = require('./src/auth/deezerSecrets');
const spotifySecrets = require('./src/auth/spotifySecrets');
const Deezer = require('./src/deezer/Deezer');
const Spotify = require('./src/spotify/Spotify');

(async () => {
  const deezer = new Deezer(deezerSecrets);
  const spotify = new Spotify(spotifySecrets);

  const deezerPlaylists = await deezer.getUserPlaylistsWithTracks();
  const spotifyPlaylists = await spotify.getUserPlaylistsWithTracks();

  console.log(deezerPlaylists)
  console.log(spotifyPlaylists);
})();

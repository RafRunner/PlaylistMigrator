'use strict';

const deezerSecrets = require('./src/auth/deezerSecrets');
const spotifySecrets = require('./src/auth/spotifySecrets');
const Deezer = require('./src/deezer/Deezer');
const Spotify = require('./src/spotify/Spotify');

(async () => {
  const deezer = new Deezer(deezerSecrets);
  const spotify = new Spotify(spotifySecrets);

  const deezerPlaylists = await deezer.getUserPlaylists();
  const spotifyPlaylists = await spotify.getUserPlaylists();

  for (const playlist of deezerPlaylists) {
    const spotifyTracks = await spotify.mapDeezerTracksToSpotify(playlist.tracks);
    console.log(spotifyTracks);
    console.log('Adding ' + spotifyTracks.length + ' songs to ' + playlist.title);

    if (playlist.title === 'Loved Tracks') {
      console.log(playlist);
      await spotify.addTracksToSavedTracks(spotifyTracks);
      return;
    }

    let equivalentSpotifyPlaylist = spotifyPlaylists.find((p) => p.name === playlist.title);
    if (!equivalentSpotifyPlaylist) {
      equivalentSpotifyPlaylist = await spotify.createPlaylist(playlist);
    }
    console.log(equivalentSpotifyPlaylist);

    await spotify.addTracksToPlaylist(equivalentSpotifyPlaylist, spotifyTracks);
  }
})();

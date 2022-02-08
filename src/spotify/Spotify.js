'use strict';

const axios = require('axios');

class Spotify {
  constructor(spotifySecrets) {
    this.axios = axios.create({
      baseURL: 'https://api.spotify.com/v1',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + spotifySecrets.oauth_token,
      },
    });
    this.spotifySecrets = spotifySecrets;
  }

  async getUserPlaylistsWithTracks() {
    const playlists = await this.getUserPlaylists();
    await this.loadTracksPerPlaylist(playlists);

    return playlist;
  }

  async getUserPlaylists() {
    const rawPlaylist = (await this.axios.get('/me/playlists')).data.items;
    rawPlaylist.map(async (p) => {
      return {
        id: p.id,
        href: p.href,
        name: p.name,
        tracks_href: p.tracks.href,
        tracks: null,
      };
    });
  }

  async loadTracksPerPlaylist(playlists) {
    for (const p of playlists) {
      const tracks = await this.getPlaylistTracks(p);
      p.tracks = tracks;
    }
  }

  async getUserSavedTracks() {
    return { tracks: await this.getPlaylistTracks('/me/tracks', 50) };
  }

  async getPlaylistTracks(tracks_href, limit = 100) {
    let offset = 0;
    let trackIds = [];

    const partialRequest = async (offset) => {
      const rawTracks = (await this.axios.get(tracks_href, { limit, offset, })).data;

      return { 
        total: rawTracks.total,
        trackIds: rawTracks.items.map((t) => (t.track.linked_from || t.track).id)
      };
    };

    let partialResponse = { total: 0, trackIds: [] };

    while (partialResponse.total > trackIds.length) {
      offset += limit;
      partialResponse = await partialRequest(offset);
      trackIds = trackIds.concat(partialResponse.trackIds);
    }

    return trackIds;
  }

  async mapDeezerTracksToSpotify(deezerTracks) {
    const trackIds = [];

    for (const dt of deezerTracks) {
      const titleWithoutEndParentheses = (dt.title.match(/^[^(]+/g) || [dt.title])[0];

      const searchTerm = encodeURIComponent(`${titleWithoutEndParentheses} ${dt.artist}`);
      const searchURL = `/search?q=${searchTerm}&type=track&market=BR&limit=1`;

      const rawSearchResults = await this.axios
        .get(searchURL)
        .catch((e) => console.log('Error fetching track: ' + JSON.stringify(dt) + '\nError: ' + e + '\nRequest: ' + searchURL));

      if (!rawSearchResults) {
        continue;
      }

      const track = rawSearchResults.data.tracks.items[0];

      if (!track) {
        console.log('No candidate for: "' + JSON.stringify(dt) + '" was not found on spotify, it will need to be added manualy\n');
        continue;
      }
      trackIds.push((track.linked_from || track).id);
    }

    return trackIds;
  }

  async createPlaylist(deezerPlaylist) {
    const rawPostResponse = (await this.axios.post(`/users/${this.spotifySecrets.user_id}/playlists`, { name: deezerPlaylist.title, })).data;

    return {
      id: rawPostResponse.id,
      href: rawPostResponse.href,
      name: rawPostResponse.name,
      tracks_href: rawPostResponse.tracks.href,
      tracks: [],
    };
  }

  buildTracksQuerryParam(playlist, trackIds, prefix, batchSize) {
    const nonAddedIds = trackIds.filter((s) => playlist.tracks.indexOf(s) === -1);
    const idBatches = [];
    const nBatches = Math.ceil(nonAddedIds.length / batchSize);

    for (let i = 0; i < nBatches; i++) {
      let batch = '';
      const currentBatchSize = i + 1 === nBatches ? nonAddedIds.length - batchSize * i : batchSize;

      for (let j = 0; j < currentBatchSize; j++) {
        batch += prefix + nonAddedIds[i * batchSize + j] + ',';
      }

      idBatches.push(batch);
    }

    return idBatches;
  }

  async addTracksToPlaylist(playlist, trackIds) {
    const spotifySongURIs = this.buildTracksQuerryParam(playlist, trackIds, 'spotify:track:', 100);

    for (const idBatch of spotifySongURIs) {
      await this.axios.post(`/playlists/${playlist.id}/tracks?uris=${idBatch}`);
    }
  }

  async addTracksToSavedTracks(trackIds) {
    const savedTracks = await this.getUserSavedTracks();
    const spotifySongURIs = this.buildTracksQuerryParam(savedTracks, trackIds, '', 50);

    for (const idBatch of spotifySongURIs) {
      await this.axios.put(`/me/tracks?ids=${idBatch}`);
    }
  }
}

module.exports = Spotify;

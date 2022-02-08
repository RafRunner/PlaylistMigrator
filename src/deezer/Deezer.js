'use strict';

const axios = require('axios');

class Deezer {
  constructor(deezerSecrets) {
    this.axios = axios.create({
      baseURL: 'https://api.deezer.com',
    });
    this.deezerSecrets = deezerSecrets;
  }

  async getUserPlaylistsWithTracks() {
    const playlists = await this.getUserPlaylists();
    await this.loadTracksPerPlaylist(playlists);

    return playlists;
  }

  async getUserPlaylists() {
    const rawPlaylistData = (await this.axios.get(`/user/${this.deezerSecrets.user_id}/playlists`)).data.data;
    return rawPlaylistData.map((p) => {
      return {
        id: p.id,
        title: p.title.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
        tracklist: p.tracklist,
        nb_tracks: p.nb_tracks,
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

  async getPlaylistTracks(playlist) {
    const rawTracks = (await this.axios.get(`${playlist.tracklist}/?limit=${playlist.nb_tracks}`)).data;

    return rawTracks.data.map((t) => {
      return {
        id: t.id,
        title: t.title,
        artist: t.artist.name,
        album: t.album.title,
      };
    });
  }
}

module.exports = Deezer;

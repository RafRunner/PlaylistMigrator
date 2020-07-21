'use strict';

const axios = require('axios');

class Deezer {
  constructor(deezerSecrets) {
    this.axios = axios.create({
      baseURL: 'https://api.deezer.com',
    });
    this.deezerSecrets = deezerSecrets;
  }

  async getUserPlaylists() {
    const rawPlaylistData = (await this.axios.get(`/user/${this.deezerSecrets.user_id}/playlists`)).data.data;
    const playlists = rawPlaylistData.map((p) => {
      return {
        id: p.id,
        title: p.title.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
        tracklist: p.tracklist,
        nb_tracks: p.nb_tracks,
      };
    });

    return this.getTracksPerPlaylist(playlists);
  }

  async getTracksPerPlaylist(playlists) {
    return Promise.all(
      playlists.map(async (p) => {
        const tracks = await this.getPlaylistTracks(p);

        return {
          ...p,
          tracks: tracks,
        };
      })
    );
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

/* eslint-disable react-refresh/only-export-components */
import axios from 'axios';
import { createContext, useState } from 'react';

export const MusicContext = createContext();

const MusicContextProvider = ({ children }) => {
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const searchSongs = async (query) => {
    if (!query.trim()) {
      setSongs([]);
      return;
    }

    setIsSearching(true);
    try {
      // Using Spotify API via a backend proxy would be better
      // For now, using a simple music API endpoint
      const response = await axios.get(
        `https://api.music.apple.com/v1/search?term=${encodeURIComponent(query)}&limit=10&types=songs`,
        {
          headers: {
            Authorization: 'Bearer YOUR_MUSIC_API_KEY',
          },
        }
      );

      // If Apple Music API fails, try alternative
      if (response.data.results?.songs?.data) {
        const songList = response.data.results.songs.data.map((song) => ({
          id: song.id,
          title: song.attributes.name,
          artist: song.attributes.artistName,
          artwork: song.attributes.artwork?.url,
          preview: song.attributes.previews?.[0]?.url,
          url: song.attributes.url,
        }));
        setSongs(songList);
      } else {
        setSongs([]);
      }
    } catch (error) {
      console.log('Music search error:', error);
      // Fallback: create mock search results
      const mockSongs = [
        {
          id: '1',
          title: query,
          artist: 'Artist Name',
          artwork: 'https://via.placeholder.com/100',
          preview: null,
          url: null,
        },
      ];
      setSongs(mockSongs);
    }
    setIsSearching(false);
  };

  const selectSong = (song) => {
    setSelectedSong(song);
  };

  const clearSong = () => {
    setSelectedSong(null);
  };

  const values = {
    songs,
    selectedSong,
    isSearching,
    searchSongs,
    selectSong,
    clearSong,
    setSongs,
  };

  return (
    <MusicContext.Provider value={values}>{children}</MusicContext.Provider>
  );
};

export default MusicContextProvider;

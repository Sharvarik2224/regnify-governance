const express = require('express');
const axios = require('axios');
const router = express.Router();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

// Route to search playlists based on role or keywords
router.get('/search', async (req, res) => {
  const { query, role } = req.query;

  if (!query && !role) {
    return res.status(400).json({ error: 'Query or role is required' });
  }

  try {
    const searchQuery = query || role;
    const response = await axios.get(YOUTUBE_API_URL, {
      params: {
        part: 'snippet',
        q: searchQuery,
        type: 'playlist',
        key: YOUTUBE_API_KEY,
        maxResults: 10
      }
    });

    const playlists = response.data.items.map(item => ({
      playlist_id: item.id.playlistId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail_url: item.snippet.thumbnails.default.url
    }));

    res.json({ playlists });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

module.exports = router;
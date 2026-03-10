const express = require('express');
const Assignment = require('../../models/Assignment');
const Playlist = require('../../models/Playlist');
const router = express.Router();

// Route to fetch assigned playlists for an employee
router.get('/:employeeId/assigned-playlists', async (req, res) => {
  const { employeeId } = req.params;

  try {
    const assignments = await Assignment.find({ employee_id: employeeId }).populate('playlist_id');

    const playlists = assignments.map(assignment => ({
      playlist_id: assignment.playlist_id.playlist_id,
      title: assignment.playlist_id.title,
      description: assignment.playlist_id.description,
      thumbnail_url: assignment.playlist_id.thumbnail_url,
      assigned_date: assignment.assigned_date
    }));

    res.json({ playlists });
  } catch (error) {
    console.error('Error fetching assigned playlists:', error);
    res.status(500).json({ error: 'Failed to fetch assigned playlists' });
  }
});

module.exports = router;
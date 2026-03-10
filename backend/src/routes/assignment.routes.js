const express = require('express');
const Assignment = require('../../models/Assignment');
const router = express.Router();

// Route to assign a playlist to an employee
router.post('/assign', async (req, res) => {
  const { employee_id, playlist_id, assigned_by } = req.body;

  if (!employee_id || !playlist_id || !assigned_by) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const newAssignment = new Assignment({
      employee_id,
      playlist_id,
      assigned_by
    });

    await newAssignment.save();
    res.status(201).json({ message: 'Playlist assigned successfully', assignment: newAssignment });
  } catch (error) {
    console.error('Error assigning playlist:', error);
    res.status(500).json({ error: 'Failed to assign playlist' });
  }
});

module.exports = router;
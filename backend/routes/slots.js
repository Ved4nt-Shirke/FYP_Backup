const express = require('express');
const router = express.Router();
const Slot = require('../models/Slots'); // Ensure case matches file name
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    console.log('Fetching all slots...');
    const slots = await Slot.find({ owner: req.user._id });
    console.log('Found slots:', slots);
    res.json(slots);
  } catch (err) {
    console.error('Error fetching slots:', err);
    res.status(500).json({ message: 'Failed to fetch slots' });
  }
});

router.post('/', async (req, res) => {
  const { weekday, time, label } = req.body;
  console.log('Creating new slot:', { weekday, time, label });
  
  try {
    // Check if slot already exists
    const existingSlot = await Slot.findOne({ owner: req.user._id, weekday, time });
    if (existingSlot) {
      console.log('Slot already exists, updating...');
      existingSlot.label = label;
      await existingSlot.save();
      res.status(200).json(existingSlot);
    } else {
      console.log('Creating new slot...');
      const slot = new Slot({ owner: req.user._id, weekday, time, label });
      await slot.save();
      res.status(201).json(slot);
    }
  } catch (err) {
    console.error('Error saving slot:', err);
    res.status(500).json({ message: 'Failed to save slot' });
  }
});

router.delete('/', async (req, res) => {
  const { weekday, time } = req.body;
  console.log('Delete request received:', { weekday, time });
  
  if (!weekday || !time) {
    console.log('Missing required fields');
    return res.status(400).json({ message: 'Weekday and time are required' });
  }
  
  try {
    console.log('Attempting to delete slot with criteria:', { weekday, time });
    const result = await Slot.deleteOne({ owner: req.user._id, weekday, time });
    console.log('Delete result:', result);
    
    if (result.deletedCount === 0) {
      console.log('No slot found to delete');
      return res.status(404).json({ message: 'Slot not found' });
    }
    
    console.log('Slot deleted successfully');
    res.status(200).json({ message: 'Slot deleted successfully' });
  } catch (err) {
    console.error('Error deleting slot:', err);
    res.status(500).json({ message: 'Failed to delete slot' });
  }
});

module.exports = router;
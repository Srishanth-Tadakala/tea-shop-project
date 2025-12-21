import { TeaItem } from '../models/index.js';
import { 
  broadcastTeaItemCreated, 
  broadcastTeaItemUpdated, 
  broadcastTeaItemDeleted 
} from '../websocket/handlers.js';

// @desc    Get all tea items
// @route   GET /api/tea
// @access  Public
export const getAllTeaItems = async (req, res, next) => {
  try {
    const { category, isAvailable, search } = req.query;
    
    let query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by availability
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    const items = await TeaItem.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tea item
// @route   GET /api/tea/:id
// @access  Public
export const getTeaItem = async (req, res, next) => {
  try {
    const item = await TeaItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Tea item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create tea item
// @route   POST /api/tea
// @access  Private/Admin
export const createTeaItem = async (req, res, next) => {
  try {
    const item = await TeaItem.create(req.body);

    // Broadcast to all connected clients
    broadcastTeaItemCreated(req.app.get('io'), item);

    res.status(201).json({
      success: true,
      data: item,
      message: 'Tea item created and broadcasted'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tea item
// @route   PUT /api/tea/:id
// @access  Private/Admin
export const updateTeaItem = async (req, res, next) => {
  try {
    let item = await TeaItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Tea item not found'
      });
    }

    item = await TeaItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    // Broadcast to all connected clients
    broadcastTeaItemUpdated(req.app.get('io'), item);

    res.status(200).json({
      success: true,
      data: item,
      message: 'Tea item updated and broadcasted'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete tea item
// @route   DELETE /api/tea/:id
// @access  Private/Admin
export const deleteTeaItem = async (req, res, next) => {
  try {
    const item = await TeaItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Tea item not found'
      });
    }

    await item.deleteOne();

    // Broadcast to all connected clients
    broadcastTeaItemDeleted(req.app.get('io'), req.params.id);

    res.status(200).json({
      success: true,
      message: 'Tea item deleted and broadcasted'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle tea item availability
// @route   PATCH /api/tea/:id/availability
// @access  Private/Admin
export const toggleTeaItemAvailability = async (req, res, next) => {
  try {
    const item = await TeaItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Tea item not found'
      });
    }

    await item.toggleAvailability();

    // Broadcast to all connected clients
    broadcastTeaItemUpdated(req.app.get('io'), item);

    res.status(200).json({
      success: true,
      data: item,
      message: `Tea item is now ${item.isAvailable ? 'available' : 'unavailable'} and broadcasted`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tea items by category
// @route   GET /api/tea/category/:category
// @access  Public
export const getTeaItemsByCategory = async (req, res, next) => {
  try {
    const items = await TeaItem.find({ 
      category: req.params.category,
      isAvailable: true 
    });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

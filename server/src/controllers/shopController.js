import { ShopStatus, TeaItem } from '../models/index.js';
import { broadcastShopStatus, broadcastShopLocation } from '../websocket/handlers.js';

// @desc    Get current shop status
// @route   GET /api/shop/status
// @access  Public
export const getShopStatus = async (req, res, next) => {
  try {
    const status = await ShopStatus.getCurrentStatus();

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get shop location
// @route   GET /api/shop/location
// @access  Public
export const getShopLocation = async (req, res, next) => {
  try {
    const status = await ShopStatus.getCurrentStatus();
    const location = {
      address: status.address || '',
      latitude: status.latitude,
      longitude: status.longitude,
      googleMapsUrl: status.googleMapsUrl || '',
      updatedAt: status.updatedAt
    };

    res.status(200).json({
      success: true,
      data: location
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update shop status
// @route   PUT /api/shop/status
// @access  Private/Admin
export const updateShopStatus = async (req, res, next) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      console.warn('[Shop] [update] Empty request body');
      return res.status(400).json({
        success: false,
        message: 'At least one field is required to update'
      });
    }

    const { isOpen, message, openingTime, closingTime, daysOpen } = req.body;

    let status;
    try {
      status = await ShopStatus.getCurrentStatus();
    } catch (statusError) {
      console.error('[Shop] [update] Failed to get current status:', statusError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to update shop status'
      });
    }

    // Update fields
    if (isOpen !== undefined) status.isOpen = isOpen;
    if (message !== undefined) status.message = message;
    if (openingTime) status.openingTime = openingTime;
    if (closingTime) status.closingTime = closingTime;
    if (daysOpen) status.daysOpen = daysOpen;
    status.updatedBy = req.admin.id;

    try {
      await status.save();
    } catch (saveError) {
      console.error('[Shop] [update] Failed to save shop status:', saveError.message);
      if (saveError.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid shop status data'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to update shop status'
      });
    }

    // Broadcast to all connected clients
    const io = req.app.get('io');
    if (io) {
      try {
        broadcastShopStatus(io, status);
        console.info('[Shop] [update] Status broadcasted');
      } catch (broadcastError) {
        console.error('[Shop] [update] Broadcast failed:', broadcastError.message);
        // Non-critical error
      }
    }

    console.info('[Shop] [update] Shop status updated successfully');
    res.status(200).json({
      success: true,
      data: status,
      message: 'Shop status updated and broadcasted'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update shop location
// @route   PUT /api/admin/shop/location
// @access  Private/Admin
export const updateShopLocation = async (req, res, next) => {
  try {
    const { address, googleMapsUrl, latitude, longitude } = req.body || {};

    if ([address, googleMapsUrl, latitude, longitude].every((value) => value === undefined)) {
      return res.status(400).json({
        success: false,
        message: 'At least one location field is required'
      });
    }

    if (address !== undefined && (typeof address !== 'string' || !address.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Address must be a non-empty string'
      });
    }

    if (googleMapsUrl !== undefined && typeof googleMapsUrl !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Google Maps URL must be a string'
      });
    }

    if (googleMapsUrl && !/^https?:\/\//i.test(googleMapsUrl.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Google Maps URL must start with http or https'
      });
    }

    let latValue = null;
    if (latitude !== undefined) {
      if (latitude === '' || latitude === null) {
        latValue = null;
      } else {
        const parsed = Number(latitude);
        if (Number.isNaN(parsed)) {
          return res.status(400).json({
            success: false,
            message: 'Latitude must be a valid number'
          });
        }
        latValue = parsed;
      }
    }

    let lngValue = null;
    if (longitude !== undefined) {
      if (longitude === '' || longitude === null) {
        lngValue = null;
      } else {
        const parsed = Number(longitude);
        if (Number.isNaN(parsed)) {
          return res.status(400).json({
            success: false,
            message: 'Longitude must be a valid number'
          });
        }
        lngValue = parsed;
      }
    }

    let status;
    try {
      status = await ShopStatus.getCurrentStatus();
    } catch (statusError) {
      console.error('[Shop] [updateLocation] Failed to get current status:', statusError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to update shop location'
      });
    }

    if (address !== undefined) status.address = address.trim();
    if (googleMapsUrl !== undefined) status.googleMapsUrl = googleMapsUrl.trim();
    if (latitude !== undefined) status.latitude = latValue;
    if (longitude !== undefined) status.longitude = lngValue;
    status.updatedBy = req.admin?.id;

    if (status.latitude !== null && (status.latitude < -90 || status.latitude > 90)) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90'
      });
    }

    if (status.longitude !== null && (status.longitude < -180 || status.longitude > 180)) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180'
      });
    }

    try {
      await status.save();
    } catch (saveError) {
      console.error('[Shop] [updateLocation] Failed to save shop location:', saveError.message);
      if (saveError.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid shop location data'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to update shop location'
      });
    }

    const location = {
      address: status.address || '',
      latitude: status.latitude,
      longitude: status.longitude,
      googleMapsUrl: status.googleMapsUrl || '',
      updatedAt: status.updatedAt
    };

    const io = req.app.get('io');
    if (io) {
      broadcastShopLocation(io, location);
    }

    res.status(200).json({
      success: true,
      data: location,
      message: 'Shop location updated'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle shop open/closed (with auto-reset feature)
// @route   POST /api/shop/status/toggle
// @access  Private/Admin
export const toggleShopStatus = async (req, res, next) => {
  try {
    let status;
    try {
      status = await ShopStatus.getCurrentStatus();
    } catch (statusError) {
      console.error('[Shop] [toggle] Failed to get current status:', statusError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to toggle shop status'
      });
    }

    const wasOpen = status.isOpen;
    
    try {
      await status.toggleStatus();
      status.updatedBy = req.admin.id;
      await status.save();
    } catch (updateError) {
      console.error('[Shop] [toggle] Failed to update status:', updateError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to toggle shop status'
      });
    }

    // Auto-reset items when shop closes
    if (wasOpen && !status.isOpen) {
      console.log('🔄 Shop closed - Auto-resetting all tea items to unavailable');
      try {
        const result = await TeaItem.updateMany({}, { isAvailable: false });
        console.info('[Shop] [toggle] Reset', result.modifiedCount, 'items to unavailable');
      } catch (resetError) {
        console.error('[Shop] [toggle] Failed to reset items:', resetError.message);
        // Log but don't fail the response - shop toggle succeeded
      }
      
      // Broadcast item updates to all clients
      const io = req.app.get('io');
      if (io) {
        try {
          io.emit('items:reset', { 
            message: 'Shop closed - All items have been reset',
            timestamp: new Date()
          });
        } catch (broadcastError) {
          console.error('[Shop] [toggle] WebSocket broadcast failed:', broadcastError.message);
          // Non-critical error
        }
      }
    }

    // Broadcast shop status to all connected clients
    const io = req.app.get('io');
    if (io) {
      try {
        broadcastShopStatus(io, status);
        console.info('[Shop] [toggle] Status broadcasted');
      } catch (broadcastError) {
        console.error('[Shop] [toggle] Status broadcast failed:', broadcastError.message);
        // Non-critical error
      }
    }

    console.info('[Shop] [toggle] Shop status toggled to:', status.isOpen ? 'OPEN' : 'CLOSED');
    res.status(200).json({
      success: true,
      data: status,
      message: `Shop is now ${status.isOpen ? 'OPEN' : 'CLOSED'}${!status.isOpen ? ' - All items reset' : ''}`
    });
  } catch (error) {
    next(error);
  }
};

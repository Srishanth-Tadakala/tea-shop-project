// Safe emit wrapper - prevents crashes from emit failures
const safeEmit = (socket, eventName, data, context = 'unknown') => {
  try {
    if (!socket || !socket.emit) {
      console.error(`[Socket.IO] [emit-error] Invalid socket object for event "${eventName}" (${context})`);
      return false;
    }
    socket.emit(eventName, data);
    return true;
  } catch (error) {
    console.error(`[Socket.IO] [emit-error] Failed to emit event "${eventName}" (${context}): ${error.message}`);
    return false;
  }
};

// Payload validation helpers
const isValidObject = (obj) => typeof obj === 'object' && obj !== null && !Array.isArray(obj);
const validateEventPayload = (eventName, payload) => {
  // Check for oversized payloads
  const payloadStr = JSON.stringify(payload);
  if (payloadStr.length > 1e6) {
    console.warn(`[Socket.IO] [validation-error] Oversized payload for "${eventName}": ${payloadStr.length} bytes (max 1MB)`);
    return false;
  }
  return true;
};

// WebSocket event handlers
export const setupWebSocket = (io) => {
  // Wrap connection handler in try-catch
  io.on('connection', (socket) => {
    try {
      console.log(`[Socket.IO] [connection] Client connected: ${socket.id}`);

      // Send welcome message with error handling
      const welcomed = safeEmit(socket, 'welcome', {
        message: 'Connected to Tea Shop server',
        timestamp: new Date().toISOString()
      }, 'welcome-emit');
      
      if (!welcomed) {
        console.warn(`[Socket.IO] [connection] Failed to send welcome message to ${socket.id}`);
      }

      // Handle socket-level errors (listener crashes, etc.)
      socket.on('error', (error) => {
        console.error(`[Socket.IO] [socket-error] Error on socket ${socket.id}: ${error?.message || error}`);
        // Send error notification to client safely
        safeEmit(socket, 'error', {
          message: 'Socket connection error occurred',
          timestamp: new Date().toISOString()
        }, 'socket-error-event');
      });

      // Handle client ping with error protection
      socket.on('ping', () => {
        try {
          safeEmit(socket, 'pong', { timestamp: Date.now() }, 'ping-pong');
        } catch (error) {
          console.error(`[Socket.IO] [ping-error] Failed to respond to ping: ${error.message}`);
        }
      });

      // Admin joins admin room
      socket.on('join:admin', (data) => {
        try {
          // Validate payload (data should be object if provided)
          if (data !== undefined && !isValidObject(data)) {
            console.warn(`[Socket.IO] [validation-error] Invalid payload for join:admin - expected object`);
            safeEmit(socket, 'error', { message: 'Invalid payload' }, 'join:admin-invalid');
            return;
          }
          
          socket.join('admin-room');
          console.log(`[Socket.IO] [join:admin] Client ${socket.id} joined admin room`);
          safeEmit(socket, 'joined:admin', { message: 'Joined admin room' }, 'join:admin-response');
        } catch (error) {
          console.error(`[Socket.IO] [join:admin] Error: ${error.message}`);
          safeEmit(socket, 'error', { message: 'Failed to join admin room' }, 'join:admin-error');
        }
      });

      // Leave admin room
      socket.on('leave:admin', () => {
        try {
          socket.leave('admin-room');
          console.log(`[Socket.IO] [leave:admin] Client ${socket.id} left admin room`);
        } catch (error) {
          console.error(`[Socket.IO] [leave:admin] Error: ${error.message}`);
        }
      });

      // Request current shop status
      socket.on('request:shopStatus', async () => {
        try {
          const { ShopStatus } = await import('../models/index.js');
          const status = await ShopStatus.getCurrentStatus();
          
          // Validate response before emitting
          if (!validateEventPayload('shopStatus:current', status)) {
            throw new Error('Payload validation failed');
          }
          
          const emitted = safeEmit(socket, 'shopStatus:current', status, 'request:shopStatus-response');
          if (emitted) {
            console.log(`[Socket.IO] [request:shopStatus] Status sent to ${socket.id}`);
          }
        } catch (error) {
          console.error(`[Socket.IO] [request:shopStatus] Error: ${error.message}`);
          safeEmit(socket, 'error', { message: 'Failed to fetch shop status' }, 'request:shopStatus-error');
        }
      });

      // Request all tea items
      socket.on('request:teaItems', async () => {
        try {
          const { TeaItem } = await import('../models/index.js');
          const items = await TeaItem.find();
          
          // Validate response before emitting
          if (!validateEventPayload('teaItems:list', items)) {
            throw new Error('Payload validation failed');
          }
          
          const emitted = safeEmit(socket, 'teaItems:list', items, 'request:teaItems-response');
          if (emitted) {
            console.log(`[Socket.IO] [request:teaItems] ${items?.length || 0} items sent to ${socket.id}`);
          }
        } catch (error) {
          console.error(`[Socket.IO] [request:teaItems] Error: ${error.message}`);
          safeEmit(socket, 'error', { message: 'Failed to fetch tea items' }, 'request:teaItems-error');
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        try {
          console.log(`[Socket.IO] [disconnect] Client ${socket.id} disconnected - Reason: ${reason}`);
        } catch (error) {
          console.error(`[Socket.IO] [disconnect-error] Error logging disconnect: ${error.message}`);
        }
      });
    } catch (error) {
      console.error(`[Socket.IO] [connection-handler-error] Fatal error in connection handler: ${error.message}`);
      console.error(`[Socket.IO] [connection-handler-error] Stack: ${error.stack}`);
      // Do NOT exit - other connections should continue
      try {
        safeEmit(socket, 'error', { message: 'Server error during initialization' }, 'init-error');
      } catch (emitError) {
        console.error(`[Socket.IO] [connection-handler-error] Failed to notify client: ${emitError.message}`);
      }
    }
  });
  
  // Handle Socket.IO server-level errors
  io.on('error', (error) => {
    console.error(`[Socket.IO] [server-error] Server-level error: ${error.message}`);
    console.error(`[Socket.IO] [server-error] Stack: ${error.stack}`);
  });
};

// Safe broadcast wrapper - prevents crashes from emit failures
const safeBroadcast = (io, eventName, data, room = null, context = 'broadcast') => {
  try {
    if (!io || typeof io.emit !== 'function') {
      console.error(`[Socket.IO] [broadcast-error] Invalid io object for event "${eventName}"`);
      return false;
    }

    // Validate payload size
    const payloadStr = JSON.stringify(data);
    if (payloadStr.length > 1e6) {
      console.error(`[Socket.IO] [broadcast-error] Oversized payload for "${eventName}": ${payloadStr.length} bytes (max 1MB)`);
      return false;
    }

    if (room) {
      io.to(room).emit(eventName, data);
    } else {
      io.emit(eventName, data);
    }
    return true;
  } catch (error) {
    console.error(`[Socket.IO] [broadcast-error] Failed to broadcast "${eventName}" (${context}): ${error.message}`);
    return false;
  }
};

// Broadcast functions to be used by controllers
export const broadcastShopStatus = (io, status) => {
  try {
    if (!io) {
      console.error(`[Socket.IO] [broadcast-shopStatus] Invalid io object`);
      return false;
    }
    
    const legacy = safeBroadcast(io, 'shopStatus:updated', status, null, 'shopStatus-update');
    const aliased = safeBroadcast(io, 'shop-status-updated', status, null, 'shopStatus-update');
    if (legacy || aliased) {
      console.log(`[Socket.IO] [broadcast-shopStatus] Status updated: ${status?.isOpen ? 'open' : 'closed'}`);
    }
    return legacy || aliased;
  } catch (error) {
    console.error(`[Socket.IO] [broadcast-shopStatus] Error: ${error.message}`);
    return false;
  }
};

export const broadcastShopLocation = (io, location) => {
  try {
    if (!io) {
      console.error(`[Socket.IO] [broadcast-shopLocation] Invalid io object`);
      return false;
    }

    const broadcasted = safeBroadcast(io, 'shopLocation:updated', location, null, 'shopLocation-update');
    if (broadcasted) {
      console.log('[Socket.IO] [broadcast-shopLocation] Location updated');
    }
    return broadcasted;
  } catch (error) {
    console.error(`[Socket.IO] [broadcast-shopLocation] Error: ${error.message}`);
    return false;
  }
};

export const broadcastTeaItemCreated = (io, item) => {
  try {
    if (!io) {
      console.error(`[Socket.IO] [broadcast-itemCreated] Invalid io object`);
      return false;
    }
    if (!item || !item._id) {
      console.error(`[Socket.IO] [broadcast-itemCreated] Invalid item object`);
      return false;
    }
    
    const broadcasted = safeBroadcast(io, 'teaItem:created', item, null, 'item-created');
    if (broadcasted) {
      console.log(`[Socket.IO] [broadcast-itemCreated] Item created: ${item.name} (ID: ${item._id})`);
    }
    return broadcasted;
  } catch (error) {
    console.error(`[Socket.IO] [broadcast-itemCreated] Error: ${error.message}`);
    return false;
  }
};

export const broadcastTeaItemUpdated = (io, item) => {
  try {
    if (!io) {
      console.error(`[Socket.IO] [broadcast-itemUpdated] Invalid io object`);
      return false;
    }
    if (!item || !item._id) {
      console.error(`[Socket.IO] [broadcast-itemUpdated] Invalid item object`);
      return false;
    }
    
    const broadcasted = safeBroadcast(io, 'teaItem:updated', item, null, 'item-updated');
    if (broadcasted) {
      console.log(`[Socket.IO] [broadcast-itemUpdated] Item updated: ${item.name} (ID: ${item._id})`);
    }
    return broadcasted;
  } catch (error) {
    console.error(`[Socket.IO] [broadcast-itemUpdated] Error: ${error.message}`);
    return false;
  }
};

export const broadcastTeaItemDeleted = (io, itemId) => {
  try {
    if (!io) {
      console.error(`[Socket.IO] [broadcast-itemDeleted] Invalid io object`);
      return false;
    }
    if (!itemId) {
      console.error(`[Socket.IO] [broadcast-itemDeleted] Invalid itemId`);
      return false;
    }
    
    const broadcasted = safeBroadcast(io, 'teaItem:deleted', itemId, null, 'item-deleted');
    if (broadcasted) {
      console.log(`[Socket.IO] [broadcast-itemDeleted] Item deleted: ${itemId}`);
    }
    return broadcasted;
  } catch (error) {
    console.error(`[Socket.IO] [broadcast-itemDeleted] Error: ${error.message}`);
    return false;
  }
};

export const broadcastContentUpdate = (io, content) => {
  try {
    if (!io) {
      console.error('[Socket.IO] [broadcast-content] Invalid io object');
      return false;
    }

    const payload = content?.toObject ? content.toObject() : content;
    const broadcasted = safeBroadcast(io, 'content:updated', payload, null, 'content-update');
    if (broadcasted) {
      console.log('[Socket.IO] [broadcast-content] Content updated');
    }
    return broadcasted;
  } catch (error) {
    console.error(`[Socket.IO] [broadcast-content] Error: ${error.message}`);
    return false;
  }
};

export const broadcastAdminAction = (io, action, data) => {
  try {
    if (!io) {
      console.error(`[Socket.IO] [broadcast-adminAction] Invalid io object`);
      return false;
    }
    if (!action) {
      console.error(`[Socket.IO] [broadcast-adminAction] Invalid action`);
      return false;
    }
    
    const broadcasted = safeBroadcast(
      io,
      'admin:action',
      {
        action,
        data,
        timestamp: new Date().toISOString()
      },
      'admin-room',
      'admin-action'
    );
    if (broadcasted) {
      console.log(`[Socket.IO] [broadcast-adminAction] Admin action: ${action}`);
    }
    return broadcasted;
  } catch (error) {
    console.error(`[Socket.IO] [broadcast-adminAction] Error: ${error.message}`);
    return false;
  }
};

import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI?.trim();
  const hasUri = Boolean(uri);
  console.log(`[Env] MONGODB_URI present: ${hasUri}`);

  if (!hasUri) {
    throw new Error('MONGODB_URI is missing. Set it in your environment before starting the server.');
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // Give Atlas/local more time to respond
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Set up connection event handlers
    mongoose.connection.on('error', (error) => {
      console.error(`[MongoDB] [connection-error] Error on established connection: ${error.message}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn(`[MongoDB] [disconnected] Connection lost to MongoDB`);
    });
    
    mongoose.connection.on('reconnected', () => {
      console.info(`[MongoDB] [reconnected] Successfully reconnected to MongoDB`);
    });
    
    return true;
  } catch (error) {
    console.error(`[MongoDB] [connection-failed] Connection Error: ${error.message}`);
    
    // Provide specific error details for common issues
    if (error.message.includes('ECONNREFUSED')) {
      console.error(`[MongoDB] [connection-failed] MongoDB server not running or port unreachable`);
    } else if (error.message.includes('authentication failed')) {
      console.error(`[MongoDB] [connection-failed] Authentication failed - check credentials`);
    } else if (error.message.includes('getaddrinfo')) {
      console.error(`[MongoDB] [connection-failed] Cannot resolve MongoDB host - check MONGODB_URI`);
    } else if (error.message.includes('timeout')) {
      console.error(`[MongoDB] [connection-failed] Connection timeout - MongoDB may be slow or unreachable`);
    }
    
    console.log('💡 Fix the database connection issue above and restart the server.');
    throw error;
  }
};


import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
  },
  database: {
    uri: process.env.MONGODB_URI!,
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true
    }
  }
};

export default config;

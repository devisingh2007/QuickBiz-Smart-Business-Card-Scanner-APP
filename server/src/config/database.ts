import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quickbiz';
  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(connUri);
    console.log('MongoDB Connected successfully');
  } catch (error: any) {
    console.warn('Primary MongoDB connection failed:', error.message || error);
    const localUri = 'mongodb://127.0.0.1:27017/quickbiz';
    if (connUri !== localUri) {
      console.log('Falling back to local MongoDB:', localUri);
      try {
        await mongoose.connect(localUri);
        console.log('MongoDB Connected successfully (Local fallback)');
      } catch (fallbackError) {
        console.error('Local MongoDB fallback connection failed:', fallbackError);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

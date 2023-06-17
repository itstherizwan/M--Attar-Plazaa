// Import necessary modules and dependencies
import { CronJob } from 'cron';
import { Order } from '../models/orderModel.js';
// Replace with your Order model

// Define the cleanup task function
const cleanupOrders = async () => {
  try {
    // Calculate the date three months ago
    const threeMonthsAgo = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000);
    
    // Delete orders older than three months with status "Delivered"
    await Order.deleteMany({ orderStatus: 'Delivered', deliveredAt: { $lt: threeMonthsAgo } });
    
    console.log('Order cleanup completed.');
  } catch (error) {
    console.error('Error cleaning up orders:', error);
  }
};

// Start the task
const startTask = () => {
  // Run the cleanup task every day at 12:00 AM
  const job = new CronJob('0 0 0 * * *', cleanupOrders);
  job.start();
  
  console.log('Task initiated.');
};

export { startTask };

import * as cron from 'node-cron';
import { checkPendingPayments, checkRefundStatuses } from './payment-status-checker';

const runCombinedJob = async () => {
  const start = Date.now();
  try {
    console.log('Starting combined job: payments and refunds check');

    // Run payment check
    await checkPendingPayments();

    // Run refund check
    await checkRefundStatuses();

    console.log('Combined job completed successfully');
  } catch (error) {
    console.error('Error in combined job:', error);
  } finally {
    const duration = Date.now() - start;
    console.log(`Combined job took ${duration}ms`);
  }
};

// Run on startup
runCombinedJob();

// Schedule combined cron job every 10 minutes
cron.schedule('*/10 * * * *', runCombinedJob);
const midtransClient = require('midtrans-client');

// Konfigurasi client Snap Midtrans
const createSnapTransaction = async (transaction) => {
  try {
    // Create Snap API instance
    let snap = new midtransClient.Snap({
      // Set to true for production environment
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    // Parameter untuk transaksi
    const parameter = {
      transaction_details: {
        order_id: transaction.orderId,
        gross_amount: transaction.amount
      },
      credit_card: {
        secure: true
      },
      customer_details: {
        first_name: transaction.name,
        email: transaction.email
      },
      item_details: transaction.items,
      callbacks: {
        finish: `${process.env.CLIENT_URL}/payment/success`,
        error: `${process.env.CLIENT_URL}/payment/error`,
        pending: `${process.env.CLIENT_URL}/payment/pending`
      }
    };

    // Create transaction token
    const transaction_token = await snap.createTransaction(parameter);
    return transaction_token;
  } catch (error) {
    console.error('Error creating Midtrans transaction:', error);
    throw error;
  }
};

// Verifikasi status pembayaran
const checkTransactionStatus = async (orderId) => {
  try {
    // Create Core API instance
    let core = new midtransClient.CoreApi({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    // Get status transaksi dari Midtrans
    const statusResponse = await core.transaction.status(orderId);
    return statusResponse;
  } catch (error) {
    console.error('Error checking transaction status:', error);
    throw error;
  }
};

// Verifikasi notifikasi dari Midtrans
const verifyNotification = async (notificationJson) => {
  try {
    // Create Core API instance
    let core = new midtransClient.CoreApi({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    // Verifikasi signature key dari notifikasi
    const verificationStatus = await core.transaction.notification(notificationJson);
    return verificationStatus;
  } catch (error) {
    console.error('Error verifying notification:', error);
    throw error;
  }
};

module.exports = {
  createSnapTransaction,
  checkTransactionStatus,
  verifyNotification
};
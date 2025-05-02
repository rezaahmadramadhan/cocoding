const midtransClient = require("midtrans-client");

// Server and client keys - using the sandbox keys for development
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173"; // Fallback URL

// Konfigurasi client Snap Midtrans
const createSnapTransaction = async (transaction) => {
  try {
    // Create Snap API instance
    let snap = new midtransClient.Snap({
      // Set to true for production environment
      isProduction: false,
      serverKey: MIDTRANS_SERVER_KEY,
      clientKey: MIDTRANS_CLIENT_KEY,
    });

    // Parameter untuk transaksi
    const parameter = {
      transaction_details: {
        order_id: transaction.orderId,
        gross_amount: transaction.amount,
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        first_name: transaction.name,
        email: transaction.email,
      },
      item_details: transaction.items,
      callbacks: {
        finish: `${CLIENT_URL}/payment?status=success&orderId=${transaction.orderId}`,
        error: `${CLIENT_URL}/payment?status=error&orderId=${transaction.orderId}`,
        pending: `${CLIENT_URL}/payment?status=pending&orderId=${transaction.orderId}`,
      },
    };

    // Create transaction token
    const transaction_token = await snap.createTransaction(parameter);
    return transaction_token;
  } catch (error) {
    console.error("Error creating Midtrans transaction:", error);
    throw error;
  }
};

// Verifikasi status pembayaran
const checkTransactionStatus = async (orderId) => {
  try {
    // Create Core API instance
    let core = new midtransClient.CoreApi({
      isProduction: false,
      serverKey: MIDTRANS_SERVER_KEY,
      clientKey: MIDTRANS_CLIENT_KEY,
    });

    // Get status transaksi dari Midtrans
    const statusResponse = await core.transaction.status(orderId);
    return statusResponse;
  } catch (error) {
    console.error("Error checking transaction status:", error);
    throw error;
  }
};

// Verifikasi notifikasi dari Midtrans
const verifyNotification = async (notificationJson) => {
  try {
    // Create Core API instance
    let core = new midtransClient.CoreApi({
      isProduction: false,
      serverKey: MIDTRANS_SERVER_KEY,
      clientKey: MIDTRANS_CLIENT_KEY,
    });

    // Verifikasi signature key dari notifikasi
    const verificationStatus = await core.transaction.notification(
      notificationJson
    );
    return verificationStatus;
  } catch (error) {
    console.error("Error verifying notification:", error);
    throw error;
  }
};

module.exports = {
  createSnapTransaction,
  checkTransactionStatus,
  verifyNotification,
};

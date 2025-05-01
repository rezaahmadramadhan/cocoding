const { OAuth2Client } = require("google-auth-library");

// Initialize the Google OAuth client with your Client ID
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    return {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    };
  } catch (error) {
    console.error("Error verifying Google token:", error);
    throw { name: "Unauthorized", message: "Invalid Google token" };
  }
}

module.exports = { verifyGoogleToken };
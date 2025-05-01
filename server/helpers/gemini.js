const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini API
const initGemini = () => {
  // Get API key from environment variables
  const apiKey = "AIzaSyC63_v_1JR1jwP8x7AlS9yewMw99v_0urQ";

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in the environment variables");
  }

  // Create and return the Gemini client
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
};

// Get a model instance
const getGeminiModel = (modelName = "gemini-1.5-pro") => {
  const genAI = initGemini();
  return genAI.getGenerativeModel({ model: modelName });
};

// Generate content with Gemini
const generateContent = async (prompt, modelName = "gemini-1.5-pro") => {
  try {
    const model = getGeminiModel(modelName);
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    throw error;
  }
};

module.exports = {
  initGemini,
  getGeminiModel,
  generateContent,
};

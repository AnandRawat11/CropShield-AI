const axios = require("axios");
const FormData = require("form-data");

/**
 * imageUrl = Cloudinary URL
 */
const callAI = async (imageUrl) => {
  // 1️⃣ Download image from Cloudinary
  const imageResponse = await axios.get(imageUrl, {
    responseType: "arraybuffer"
  });

  // 2️⃣ Create form-data with image bytes
  const formData = new FormData();
  formData.append("image", imageResponse.data, {
    filename: "image.jpg",
    contentType: "image/jpeg"
  });

  // 3️⃣ Send to AI API
  const response = await axios.post(
    "http://127.0.0.1:8000/predict",
    formData,
    {
      headers: formData.getHeaders(),
      timeout: 15000
    }
  );

  return response.data;
};

module.exports = callAI;

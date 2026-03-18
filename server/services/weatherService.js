const axios = require('axios');

/**
 * Fetches real-time weather data from Open-Meteo API using latitude and longitude.
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<string|null>} A formatted weather string or null if failed.
 */
const getWeatherContext = async (latitude, longitude) => {
  if (!latitude || !longitude) return null;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    const response = await axios.get(url, { timeout: 3000 }); // 3s timeout to avoid keeping user waiting
    
    if (response.data && response.data.current_weather) {
      const weather = response.data.current_weather;
      return `Current weather at user's location: ${weather.temperature}°C, Wind Speed: ${weather.windspeed} km/h.`;
    }
    return null;
  } catch (error) {
    console.warn("[weatherService] Failed to fetch weather:", error.message);
    return null; // Gracefully degrade if weather fails
  }
};

module.exports = {
  getWeatherContext
};

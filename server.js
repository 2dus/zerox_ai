const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to simulate a delay (retry mechanism)
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Route to handle API requests
app.post('/generate', async (req, res) => {
  const maxRetries = 3; // Maximum retry attempts
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // Make the request to the Anthropic API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': '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',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: "claude-3-opus-20240229",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: req.body.messages[0]?.content || "No content provided"
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.content || !data.content[0]?.text) {
        throw new Error('Invalid API response structure');
      }

      // Successfully retrieved data, respond with it
      return res.status(200).json({ output: data.content[0].text });
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error.message);
      attempt++;

      if (attempt === maxRetries) {
        return res.status(500).json({
          error: `Failed after ${maxRetries} attempts: ${error.message}`
        });
      }

      // Wait before retrying (exponential backoff)
      await sleep(1000 * attempt);
    }
  }
});

// Export the app for Vercel
module.exports = app;

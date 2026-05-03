import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "."))); // Serve files from current folder

// Your chat endpoint
app.post("/chat", async (req, res) => {
  try {
    console.log("Received chat request:", req.body); // Debug log

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.GROQ_API_KEY
      },
      body: JSON.stringify(req.body)
    });

    const text = await response.text();
    console.log("Groq response status:", response.status); // Debug log

    try {
      const data = JSON.parse(text);
      
      if (!response.ok) {
        console.log("Error from Groq:", data); // Debug log
        return res.status(response.status).json(data);
      }
      
      res.json(data);
    } catch (parseError) {
      console.error("Failed to parse JSON:", text); // Debug log
      res.status(500).json({ error: { message: "Invalid JSON from API" } });
    }

  } catch (err) {
    console.error("Server error:", err); // Debug log
    res.status(500).json({ error: { message: "Server crashed: " + err.message } });
  }
});

// Serve your HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Make sure your GROQ_API_KEY is set in .env file`);
});
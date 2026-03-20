import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";

const DATA_FILE = path.join(process.cwd(), "data.json");

// Helper to read/write data
const readData = () => {
  if (!fs.existsSync(DATA_FILE)) return { conversations: [] };
  try {
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    if (!content.trim()) return { conversations: [] };
    return JSON.parse(content);
  } catch (e) {
    console.error("Error reading data file:", e);
    return { conversations: [] };
  }
};

const writeData = (data: any) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(bodyParser.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/conversations", (req, res) => {
    const data = readData();
    res.json(data.conversations);
  });

  app.post("/api/conversations", (req, res) => {
    const conversations = req.body;
    writeData({ conversations });
    res.json({ status: "ok" });
  });

  app.post("/api/messages/:convId", (req, res) => {
    const { convId } = req.params;
    const message = req.body;
    const data = readData();
    const convIndex = data.conversations.findIndex((c: any) => c.id === convId);
    
    if (convIndex > -1) {
      data.conversations[convIndex].messages.push(message);
      data.conversations[convIndex].lastMessage = message.text || "Image";
      data.conversations[convIndex].lastMessageTime = message.timestamp;
      writeData(data);
      res.json({ status: "ok" });
    } else {
      res.status(404).json({ error: "Conversation not found" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

const express = require("express");
const axios = require("axios");
const https = require("https");

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const app = express();
app.use(express.json());

const VK_CONFIRMATION_CODE = process.env.VK_CONFIRMATION_CODE;
const MAX_TOKEN = process.env.MAX_TOKEN;
const MAX_CHAT_ID = process.env.MAX_CHAT_ID;

const processedMessages = new Set();

app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

    if (data.type === "confirmation") {
      return res.send(VK_CONFIRMATION_CODE);
    }

    if (data.type === "message_new") {
      const message = data.object.message;

      const messageKey =
        message.id || `${message.from_id}-${message.date}-${message.text}`;

      if (processedMessages.has(messageKey)) {
        return res.send("ok");
      }

      processedMessages.add(messageKey);

      setTimeout(() => {
        processedMessages.delete(messageKey);
      }, 10 * 60 * 1000);

      const text =
        `💬 Новое сообщение из ВК\n\n` +
        `От: ${message.from_id}\n` +
        `${message.text || "(без текста)"}`;

      await axios.post(
        `https://platform-api2.max.ru/messages?chat_id=${MAX_CHAT_ID}`,
        {
          text: text
        },
        {
          httpsAgent,
          headers: {
            Authorization: MAX_TOKEN
          }
        }
      );
    }

    return res.send("ok");
  } catch (e) {
    console.error(e.response?.data || e.message);
    return res.send("error");
  }
});

app.post("/max-webhook", (req, res) => {
  console.log("MAX UPDATE:", JSON.stringify(req.body, null, 2));
  return res.send("ok");
});

app.listen(process.env.PORT || 3000);

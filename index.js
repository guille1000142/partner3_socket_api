require("dotenv").config();
const express = require("express");
const app = express();
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { db } = require("./firebase/firebase");

const chat = db.collection("bot");
const users = db.collection("users");
const donations = db.collection("donations");
// const predictions = db.collection("predictions");
const promotions = db.collection("promotions");

var botData = [];
var usersData = [];
var donationsData = [];
var predictionsData = [];
var promotionsData = [];

const botListener = chat.onSnapshot(
  (docsSnapshot) => {
    const docs = docsSnapshot.docs.map((doc) => doc.data());
    botData = docs;
  },
  (err) => {
    console.log(`Encountered error: ${err}`);
  }
);

const usersListener = users.onSnapshot(
  (docsSnapshot) => {
    const docs = docsSnapshot.docs.map((doc) => doc.data());
    usersData = docs;
  },
  (err) => {
    console.log(`Encountered error: ${err}`);
  }
);

const donationsListener = donations.onSnapshot(
  (docsSnapshot) => {
    const docs = docsSnapshot.docs.map((doc) => doc.data());
    donationsData = docs;
  },
  (err) => {
    console.log(`Encountered error: ${err}`);
  }
);

// const predictionsListener = predictions.onSnapshot(
//   (docsSnapshot) => {
//     const docs = docsSnapshot.docs.map((doc) => doc.data());
//     predictionsData = docs;
//   },
//   (err) => {
//     console.log(`Encountered error: ${err}`);
//   }
// );

const promotionsListener = promotions.onSnapshot(
  (docsSnapshot) => {
    const docs = docsSnapshot.docs.map((doc) => doc.data());
    promotionsData = docs;
  },
  (err) => {
    console.log(`Encountered error: ${err}`);
  }
);

app.use(cors());

app.get("/", (req, res) => {
  res.send("<h1>Partner3</h1>");
});

app.get("/api/v1/:code", (req, res) => {
  axios("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: {
      ContentType: "application/x-www-form-urlencoded",
    },
    data: {
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      code: req.params.code,
      grant_type: "authorization_code",
      redirect_uri: process.env.TWITCH_REDIRECT_URI,
    },
  })
    .then((tokens) => res.json(tokens.data))
    .catch((error) => res.status(400).end());
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
    transports: ["websokcet", "polling"],
    credentials: true,
  },
  allowEIO3: true,
});

io.use(function (socket, next) {
  if (socket.handshake.query && socket.handshake.query.token) {
    jwt.verify(
      socket.handshake.query.token,
      process.env.PRIVATE_KEY,
      function (err, decoded) {
        if (err) return next(new Error("Authentication error"));
        socket.decoded = decoded;
        next();
      }
    );
  } else {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log(socket.id);

  socket.emit("receive_bot", botData);
  socket.emit("receive_users", usersData);
  socket.emit("receive_donations", donationsData);
  // socket.emit("receive_predictions", predictionsData);
  socket.emit("receive_promotions", promotionsData);

  setInterval(() => {
    socket.emit("receive_donations", donationsData);
    // socket.emit("receive_predictions", predictionsData);
  }, 10000);

  socket.on("send_bot", (data) => {
    socket.emit("receive_bot", botData);
  });

  socket.on("send_users", (data) => {
    socket.emit("receive_users", usersData);
  });

  socket.on("send_donations", (data) => {
    socket.emit("receive_donations", donationsData);
  });

  // socket.on("send_predictions", (data) => {
  //   socket.emit("receive_predictions", predictionsData);
  // });

  socket.on("send_promotions", (data) => {
    socket.emit("receive_promotions", promotionsData);
  });
});
const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

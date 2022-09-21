require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { db } = require("./firebase/firebase");

const chat = db.collection("bot");
const users = db.collection("users");
const donations = db.collection("donations");
const predictions = db.collection("predictions");
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

const predictionsListener = predictions.onSnapshot(
  (docsSnapshot) => {
    const docs = docsSnapshot.docs.map((doc) => doc.data());
    predictionsData = docs;
  },
  (err) => {
    console.log(`Encountered error: ${err}`);
  }
);

const promotionsListener = promotions.onSnapshot(
  (docsSnapshot) => {
    const docs = docsSnapshot.docs.map((doc) => doc.data());
    promotionsData = docs;
  },
  (err) => {
    console.log(`Encountered error: ${err}`);
  }
);

app.get("/", (req, res) => {
  res.send("<h1>Partner3</h1>");
});

app.use(cors());

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
  socket.emit("receive_predictions", predictionsData);
  socket.emit("receive_promotions", promotionsData);

  // setInterval(() => {
  //   socket.emit("receive_donations", donationsData);
  //   socket.emit("receive_predictions", predictionsData);
  // }, 5000);

  socket.on("send_bot", (data) => {
    socket.emit("receive_bot", botData);
  });

  socket.on("send_users", (data) => {
    socket.emit("receive_users", usersData);
  });

  socket.on("send_donations", (data) => {
    socket.emit("receive_donations", donationsData);
  });

  socket.on("send_predictions", (data) => {
    socket.emit("receive_predictions", predictionsData);
  });

  socket.on("send_promotions", (data) => {
    socket.emit("receive_promotions", promotionsData);
  });
});
const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

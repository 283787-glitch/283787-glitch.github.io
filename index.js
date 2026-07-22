const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Prosty endpoint HTTP
app.get('/', (req, res) => {
  res.send('<h1>Serwer Express + Socket.IO działa w Codespaces! 🚀</h1>');
});

// Obsługa połączeń w czasie rzeczywistym (Socket.IO)
io.on('connection', (socket) => {
  console.log('🟢 Nowy użytkownik połączył się. ID:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔴 Użytkownik rozłączył się. ID:', socket.id);
  });
});

// Uruchomienie serwera na porcie 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Serwer działa i nasłuchuje na porcie ${PORT}`);
});
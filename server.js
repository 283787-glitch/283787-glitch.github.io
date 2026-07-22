const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = {};

// Alfabety do losowania (bez trudnych liter)
const ALPHABETS = {
    PL: "ABCDEFGHIJKLMNOPRSTUWZ",
    EN: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    DE: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
};

io.on('connection', (socket) => {
    socket.on('joinRoom', (room) => {
        socket.join(room);
        if (!rooms[room]) {
            // isPlaying pilnuje, czy gra trwa, answers zbiera odpowiedzi na koniec rundy
            rooms[room] = { players: 0, answers: {}, isPlaying: false };
        }
        rooms[room].players++;
        io.to(room).emit('playerCount', rooms[room].players);
    });

    socket.on('startGame', ({ room, categories, language }) => {
        if (rooms[room]) {
            rooms[room].answers = {}; // Reset odpowiedzi nowej rundy
            rooms[room].isPlaying = true;
        }
        const alphabet = ALPHABETS[language] || ALPHABETS['PL'];
        const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
        io.to(room).emit('gameStarted', { letter: randomLetter, categories, language });
    });

    socket.on('stopGame', ({ room }) => {
        io.to(room).emit('forceStop'); // Nakazuje wszystkim przestać pisać
    });

    // Zbieranie odpowiedzi od graczy po wciśnięciu STOP
    socket.on('submitAnswers', ({ room, answers, playerName }) => {
        if (!rooms[room]) return;

        rooms[room].answers[socket.id] = { playerName, answers };

        // Jeśli serwer zebrał odpowiedzi od wszystkich graczy w pokoju:
        if (Object.keys(rooms[room].answers).length === rooms[room].players) {
            io.to(room).emit('showResults', rooms[room].answers);
            rooms[room].isPlaying = false;
        }
    });

    socket.on('disconnecting', () => {
        for (const room of socket.rooms) {
            if (rooms[room]) {
                rooms[room].players--;
                delete rooms[room].answers[socket.id]; // Usuwamy jego ewentualne odpowiedzi
                io.to(room).emit('playerCount', rooms[room].players);

                // Jeżeli ktoś uciekł podczas wysyłania wyników, sprawdźmy, czy już nie pokazać tabeli reszcie:
                if (rooms[room].isPlaying && rooms[room].players > 0 && 
                    Object.keys(rooms[room].answers).length === rooms[room].players) {
                    io.to(room).emit('showResults', rooms[room].answers);
                    rooms[room].isPlaying = false;
                }

                // Usuń pusty pokój z pamięci
                if (rooms[room].players <= 0) {
                    delete rooms[room];
                }
            }
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});
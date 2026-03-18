const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');
const router = require('./router');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:3001',
  'https://rxhssdpvbc.us-east-1.awsapprunner.com' 
];
// CORS setup
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

const io = socketio(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin
      if (!origin) return callback(null, true);
      
      // Check if origin is allowed
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(router);

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

io.on('connect', (socket) => {
  console.log('✅ New client connected:', socket.id);

  socket.on('join', ({ name, room }, callback) => {
    console.log(`👤 Join attempt: ${name} trying to join ${room}`);
    
    const { error, user } = addUser({ id: socket.id, name, room });

    if(error) {
      console.log('❌ Join error:', error);
      return callback(error);
    }

    console.log(`✅ User added:`, user);
    socket.join(user.room);

    // Welcome message to the user
    socket.emit('message', { user: 'admin', text: `${user.name}, welcome to room ${user.room}.`});
    
    // Broadcast to others in room
    socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });

    // Send room data to everyone
    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    console.log('📥 sendMessage received:', message);
    console.log('📥 Socket ID:', socket.id);
    
    // Get user from our users array
    const user = getUser(socket.id);
    console.log('📥 User from getUser:', user);
    
    if (!user) {
      console.log('❌ ERROR: No user found for socket ID:', socket.id);
      
      // Log all current users for debugging
      const allUsers = require('./users').getAllUsers?.() || 'Cannot get all users';
      console.log('Current users in system:', allUsers);
      
      // Option: Send error back to client
      socket.emit('message', { 
        user: 'admin', 
        text: 'Error: You were disconnected. Please rejoin the room.' 
      });
      
      // You could also try to reconnect or rejoin automatically
      return;
    }
    
    console.log(`✅ Sending message from ${user.name} in room ${user.room}`);
    io.to(user.room).emit('message', { user: user.name, text: message });
    console.log(`📤 Message sent to room ${user.room}: ${message}`);

    // Acknowledge receipt
    if (callback) callback();
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    const user = removeUser(socket.id);

    if(user) {
      console.log(`👋 ${user.name} left room ${user.room}`);
      io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
    }
  });
});

server.listen(process.env.PORT || 5001, () => console.log(`✅ Server has started on port ${process.env.PORT || 5001}`));
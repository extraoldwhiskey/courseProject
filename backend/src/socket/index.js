const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('joinInventory', (inventoryId) => {
      socket.join(`inventory:${inventoryId}`);
    });
    socket.on('leaveInventory', (inventoryId) => {
      socket.leave(`inventory:${inventoryId}`);
    });
  });

  return io;
};

const getIo = () => io;

module.exports = initSocket;
module.exports.getIo = getIo;

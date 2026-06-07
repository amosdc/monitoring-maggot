const { Server } = require('socket.io');

let io = null;

module.exports = {
  // Inisialisasi Socket.IO Server
  init: (httpServer, clientUrl) => {
    io = new Server(httpServer, {
      cors: {
        origin: clientUrl || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      console.log(`[Socket.IO] Client terhubung: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client terputus: ${socket.id}`);
      });
    });

    return io;
  },

  // Mendapatkan instance io yang sudah diinisialisasi
  getIO: () => {
    if (!io) {
      throw new Error('Socket.IO belum diinisialisasi!');
    }
    return io;
  },

  // Helper untuk memancarkan data sensor ke semua client
  emitSensorData: (data) => {
    if (io) {
      io.emit('sensor_data', data);
      console.log('[Socket.IO] Data sensor dikirim ke client:', data);
    }
  }
};

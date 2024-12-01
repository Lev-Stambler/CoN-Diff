const express = require('express');
const http = require('http');
const JIFFServer = require('jiff-mpc/lib/jiff-server');
const JIFFServerBigNumber = require('jiff-mpc/lib/ext/jiff-server-bignumber');
const config = require('./config'); // Import configuration

// Create Express app
const app = express();
const server = http.createServer(app);

// JIFF server setup
const jiffServer = new JIFFServer(server, {
  logs: true, // Enable logging
  party_count: config.N_PARTIES
});
const field_size = config.SECRET_KEY_FEILDSIZE * (config.N_PARTIES + 1)
// Apply BigNumber extension with custom field size
jiffServer.apply_extension(JIFFServerBigNumber, { Zp: config.MPC_FIELD_SIZE });

// Start server
server.listen(config.PORT, () => {
  console.log(`Server running at ${config.SERVER_URL}`);
  console.log(`Expected number of parties: ${config.N_PARTIES}`);
});

// API endpoint (Optional)
app.get('/', (req, res) => {
  res.send('Secure MPC Server is Running!');
});


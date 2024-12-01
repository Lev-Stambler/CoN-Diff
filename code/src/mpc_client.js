const JIFFClient = require('jiff-mpc/lib/jiff-client');
const JIFFClientBigNumber = require('jiff-mpc/lib/ext/jiff-client-bignumber');
const config = require('./config'); // Import configuration

// Create JIFF client instance
const jiffClient = new JIFFClient(config.SERVER_URL, config.COMPUTATION_ID, { autoConnect: false });

// Apply BigNumber extension with custom field size
jiffClient.apply_extension(JIFFClientBigNumber, { Zp: config.FIELD_SIZE });

// Connect to the server
jiffClient.connect();

// Define client secret
const secret = Math.floor(Math.random() * 100); // Random secret for this example
console.log(`My secret: ${secret}`);

// Participate in MPC computation
jiffClient.wait_for(['share'], () => {
  const shares = jiffClient.share(secret, config.N_PARTIES); // Share the secret securely with all parties

  // Aggregate shares securely
  let sum = shares[1]; // Initialize sum with the first share
  for (let i = 2; i <= config.N_PARTIES; i++) {
    sum = sum.sadd(shares[i]); // Dynamically sum all shares
  }

  sum.then((result) => {
    console.log(`Aggregated sum result: ${result}`);
    jiffClient.disconnect();
  });
});

// for i in {1..3}; do node src/mpc_client.js & done


const config = {
  SERVER_URL: 'http://localhost:3000',
  PORT: 3000,
  COMPUTATION_ID: 'sum_example',
  FIELD_SIZE: BigInt('340282366920938463463374607431768211507'), // 128-bit prime
  N_PARTIES: 3, // Number of parties in the MPC computation
};

module.exports = config;


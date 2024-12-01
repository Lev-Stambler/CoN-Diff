const _N_PARTIES = 3;
const _SECRET_FIELD_SIZE = 2;

function isPrime(num) {
    if (num < 2) return false; // 0 and 1 are not prime numbers
    for (let i = 2; i * i <= num; i++) {
        if (num % i === 0) return false; // If divisible, not prime
    }
    return true;
}

function nextPrime(n) {
    let candidate = n + 1; // Start searching from the next number
    while (!isPrime(candidate)) {
        candidate++; // Increment until a prime is found
    }
    return candidate;
}

const config = {
  SERVER_URL: 'http://localhost:3000',
  PORT: 3000,
  COMPUTATION_ID: 'sum_example',
  FIELD_SIZE: BigInt('340282366920938463463374607431768211507'), // 128-bit prime
  MPC_FIELD_SIZE: nextPrime(_SECRET_FIELD_SIZE * (_N_PARTIES + 1)), // Secret key field size
  //FIELD_SIZE: BigInt('340282366920938463463374607431768211507'), // 128-bit prime
  N_PARTIES: _N_PARTIES, // Number of parties in the MPC computation
};

module.exports = config;


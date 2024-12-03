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

/**
 * Serialize an object with BigInt values to a JSON string.
 * @param {Object} obj - The object to serialize.
 * @returns {string} - The serialized JSON string.
 */
function serializeBigInt(obj) {
    return JSON.stringify(obj, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
    );
}

/**
 * Deserialize a JSON string back into an object, converting stringified BigInt values.
 * @param {string} json - The JSON string to deserialize.
 * @returns {Object} - The deserialized object with BigInt values.
 */
function deserializeBigInt(json) {
    return JSON.parse(json, (_, value) =>
        /^[0-9]+$/.test(value) ? BigInt(value) : value
    );
}

const config = {
  SERVER_URL: 'http://localhost:3000',
  PORT: 3000,
  COMPUTATION_ID: 'sum_example',
  FIELD_SIZE: BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617'), // 128-bit prime
  MPC_FIELD_SIZE: nextPrime(_SECRET_FIELD_SIZE * (_N_PARTIES + 1)), // Secret key field size
  //FIELD_SIZE: BigInt('340282366920938463463374607431768211507'), // 128-bit prime
  N_PARTIES: _N_PARTIES, // Number of parties in the MPC computation
  N: 80,
  M: 80,
  AGG_SK_FILE_PATH: 'db/aggregated_sk.json',
  secretFilePath: (partyId) => `db/party_${partyId}_sk.json`,
  commRandFilePath: (partyId) => `db/party_${partyId}_comm.json`,
  serializeBigInt,
  deserializeBigInt,
};

module.exports = config;


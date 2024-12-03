const JIFFClient = require('jiff-mpc/lib/jiff-client');
const JIFFClientBigNumber = require('jiff-mpc/lib/ext/jiff-client-bignumber');
const config = require('./config'); // Import configuration
const NodeRSA = require('node-rsa'); // Example library for key generation
const fs = require('fs'); // File system library
const crypto = require('crypto'); // Crypto library
const Fp = config.FIELD_SIZE;


// For Node.js environments
function generateWithNodeCryptoOverBin(N, modulus) {
  const result = new Array(N);
  const randomArray = crypto.randomBytes(N);

  for (let i = 0; i < N; i++) {
	result[i] = randomArray[i] % 2; // Returns 0, 1, or 2
  }

  return result;
}

/**
 * Generate a random big number in the field Fp
 * @param {BigInt} p - The modulus p for the finite field Fp.
 * @returns {BigInt} - A random number in the range [0, p-1].
 */
function randomBigNumberFp(p) {
    if (typeof p !== 'bigint') {
        throw new Error("The modulus p must be a BigInt.");
    }

    const byteLength = Math.ceil(p.toString(2).length / 8);
    let randomBigInt;

    do {
        // Generate random bytes
        const randomBytes = crypto.randomBytes(byteLength);
        // Convert bytes to a BigInt
        randomBigInt = BigInt('0x' + randomBytes.toString('hex'));
    } while (randomBigInt >= p); // Ensure the number is less than p

    return randomBigInt;
}



// Key Generation (For demonstration purposes; keys should be pre-generated and securely stored in practice)
const key = new NodeRSA({ b: 512 }); // Generates a new 512-bit RSA key pair

const performAggregation = async (jiffClient, vectorSecret) => {
	const summed_shares = await new Promise(async (resolve) => {
		//const shares = jiffClient.share_array(vectorSecret, vectorSecret.length); // Share the secret vector securely with all parties
		// Participate in MPC computation
		jiffClient.wait_for([1], function () {
			console.log("AAA")
			const shares = jiffClient.share_array(vectorSecret, vectorSecret.length); // Share the secret vector securely with all parties
			console.log("BBB")

			// Aggregate each component of the vector securely
			const sumPromises = [];
			for (let i = 0; i < vectorLength; i++) {
				let sum = shares[1][i]; // Initialize sum with the first share for this index
				for (let j = 2; j <= config.N_PARTIES; j++) {
					sum = sum.sadd(shares[j][i]); // Dynamically sum all shares for this index
				}
				sumPromises.push(sum);
			}

			Promise.all(sumPromises).then((result) => {
				console.log(`Aggregated vector sum result: ${result}`);
				jiffClient.disconnect();
				fs.writeFileSync(config.AGG_SK_FILE_PATH, JSON.stringify(result, null, 2), 'utf8');
				resolve(result);
			});
		});
	});
};

const aggWrapper = async (vectorSecret) => {
	const jiffClient = new JIFFClient(config.SERVER_URL, config.COMPUTATION_ID, { 
		autoConnect: false,
		crypto_provider: true,
		party_count: config.N_PARTIES,

	});
	// Create JIFF client instance
	console.log("Setting big number", config.MPC_FIELD_SIZE);
	// Apply BigNumber extension with custom field size
	jiffClient.apply_extension(JIFFClientBigNumber, { Zp: config.MPC_FIELD_SIZE });

	console.log("attempting connection");
	// Connect to the server
	jiffClient.connect();



	// Define client vector (let's assume each vector has 5 elements)
	const vectorLength = 5;

	performAggregation(jiffClient, vectorSecret);
}

const main = async (N, M, partyId) => {
	// Generate random element over Fp
	const sk = generateWithNodeCryptoOverBin(M);
	const commRand = randomBigNumberFp(Fp);

	const filePath = config.secretFilePath(partyId);
	const randFilePath = config.commRandFilePath(partyId);
	fs.writeFileSync(filePath, JSON.stringify(sk, null, 2), 'utf8');
	fs.writeFileSync(randFilePath, JSON.stringify(commRand, null, 2), 'utf8');
	// Perform aggregation and save secret key
	await aggWrapper(sk);
}

const args = process.argv.slice(2);
const N = parseInt(args[0]);
const M = parseInt(args[1]);
const partyId = parseInt(args[2]);
console.log(`Running client setup with N=${N}, M=${M}, partyId=${partyId}`, typeof(N));
main(N, M, partyId);


// TODO: serial BigInt!!

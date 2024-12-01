const JIFFClient = require('jiff-mpc/lib/jiff-client');
const JIFFClientBigNumber = require('jiff-mpc/lib/ext/jiff-client-bignumber');
const config = require('./config'); // Import configuration
const NodeRSA = require('node-rsa'); // Example library for key generation

// Key Generation (For demonstration purposes; keys should be pre-generated and securely stored in practice)
const key = new NodeRSA({ b: 512 }); // Generates a new 512-bit RSA key pair

// Get Public and Private Keys
const publicKey = key.exportKey('public'); // Public key
const privateKey = key.exportKey('private'); // Private key


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
				resolve(result);
			});
		});
	});
};

console.log("Creating JIFF client", publicKey, privateKey);

const jiffClient = new JIFFClient(config.SERVER_URL, config.COMPUTATION_ID, { 
	autoConnect: false,
	crypto_provider: true,
	party_count: config.N_PARTIES,
	//public_key: publicKey, // Provide public key for communication

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
const vectorSecret = Array.from({ length: vectorLength }, () => Math.floor(Math.random() * 2)); // Random vector for this example

performAggregation(jiffClient, vectorSecret);

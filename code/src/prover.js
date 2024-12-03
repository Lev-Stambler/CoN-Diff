const buildMimcSponge = require("circomlibjs").buildMimcSponge;
const wasm_tester = require("circom_tester").wasm;
const path = require("path");
const config = require("./config");
const crypto = require("crypto");
const fs = require("fs");

const CIRCOM_FILE = "LweVer.circom";

// Code for the prover
let mimcSponge = null
let F = null

const Fp = config.FIELD_SIZE;

// Function to multiply a matrix by a vector over a BigInt modulus Fp
function matrixVectorMultiply(matrix, vector, Fp) {
  const result = new Array(matrix.length).fill(0n);

  for (let i = 0; i < matrix.length; i++) {
    let sum = BigInt(0);
    for (let j = 0; j < vector.length; j++) {
      sum = (sum + BigInt(matrix[i][j]) * BigInt(vector[j])) % Fp;
    }
    result[i] = sum;
  }

  return result;
}


// For Node.js environments
function generateDummyDataWithNodeCrypto(N) {
  const result = new Array(N);
  const randomArray = crypto.randomBytes(N);

  for (let i = 0; i < N; i++) {
    result[i] = randomArray[i] % 10; // Returns 0, 1, or 2
  }

  return result;
}



// For Node.js environments
function generateWithNodeCrypto(N) {
  const result = new Array(N);
  const randomArray = crypto.randomBytes(N);

  for (let i = 0; i < N; i++) {
    const rand = randomArray[i] % 3; // Returns 0, 1, or 2
    result[i] = rand === 0 ? -1 : rand === 1 ? 0 : 1;
  }

  return result;
}

// For Node.js environments
function genSK(N) {
  const result = new Array(N);
  const randomArray = crypto.randomBytes(N);

  for (let i = 0; i < N; i++) {
    const rand = randomArray[i] % 2; // Returns 0, 1, or 2
    result[i] = rand === 0 ? 0 : 1;
  }

  return result;
}



// Use circomlib's tester here for debugging
/**
 * @param {Array<Array<BigInt>>} matrix
 */
const verify_circuit_test = async (matrix, sk_comm, sk, sk_rand, error, data, partyId, skip_proof_gen=false) => {
        circuit = await wasm_tester(path.join(__dirname, "..", "circuits", "LweVer.circom"), {
		
	});
	console.log("Circuit loaded");

	const product = matrixVectorMultiply(matrix, sk, Fp);

	const outputs = product.map((x, i) => (x + BigInt(error[i]) + BigInt(data[i])
		) % Fp);

	const w = await circuit.calculateWitness({matrix, outputs, comm: sk_comm, sk, sk_rand, error, data});


	if (!skip_proof_gen) {
		const { proof, publicSignals }  = await snarkjs.groth16.fullProve( {matrix, outputs, comm: sk_comm, sk, sk_rand, error, data}, "circuits/LweVer.wasm", "circuits.zkey");
		fs.writeFileSync(config.proofFilePath(partyId), JSON.stringify(proof));
		fs.writeFileSync(config.pubSigFilePath(partyId), JSON.stringify(publicSignals));
	}
	const vKey = JSON.parse(fs.readFileSync("verification_key.json"));
	const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

	return outputs;
}


const lazyLoad = async () => {
	if (!mimcSponge || !F) {
		mimcSponge = await buildMimcSponge();
		F = mimcSponge.F;
	}
}

const genPubMatrix = async (N, M, prf_inp) => {
	await lazyLoad()

	const out = mimcSponge.multiHash([prf_inp, 0], 0, N * M)
	const outsSerial = out.map(o => F.toObject(o))

	let matrix = [];
	for (let i = 0; i < N; i++) {
		let row = [];
		for (let j = 0; j < M; j++) {
			row.push(outsSerial[i * M + j])
		}
		matrix.push(row)
	}
	return matrix
}

const proveStep = async (data, prf_inp, sk_comm, sk, sk_rand, error, partyId) => {
	const matrix = await genPubMatrix(config.N, config.M, prf_inp);
	const outputs = await verify_circuit_test(matrix, sk_comm, sk, sk_rand, error, data, partyId);
	return outputs
}

//module.exports = genPubMatrix;
const args = process.argv.slice(2);
const partyId = parseInt(args[0]);
const prfInp = parseInt(args[1]);

// load secret key, sk_comm, and sk_rand
const sk = JSON.parse(fs.readFileSync(config.secretFilePath(partyId), 'utf8'));
const sk_comm = config.deserializeBigInt(fs.readFileSync(config.commPath(partyId), 'utf8'));
const sk_rand = config.deserializeBigInt(fs.readFileSync(config.commRandFilePath(partyId), 'utf8'));
const error = generateWithNodeCrypto(config.N);
const data = generateDummyDataWithNodeCrypto(config.N); // We have this as a dummy for now!
const dp_data = data.map((d, i) =>  
	(d + config.sampleDiscreteGaussian(config.N_PARTIES)) + config.SCALE_OFFSET_FACTOR
);
console.log("Proving step", partyId, dp_data);
proveStep(dp_data, prfInp, sk_comm, sk, sk_rand, error, partyId).then(outputs => {
	console.log(outputs);
	// Write outputs to file
	fs.writeFileSync(config.outputFilePath(partyId), JSON.stringify(outputs.map(config.serializeBigInt)), 'utf8');
})


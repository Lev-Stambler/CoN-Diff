const buildMimcSponge = require("circomlibjs").buildMimcSponge;
const wasm_tester = require("circom_tester").wasm;
const path = require("path");
const config = require("./config");
const crypto = require("crypto");

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
const verify_circuit_test = async (matrix, sk_comm, sk, sk_rand, error, data) => {
        circuit = await wasm_tester(path.join(__dirname, "..", "circuits", "LweVer.circom"), {
		
	});
	console.log("Circuit loaded");

	const product = matrixVectorMultiply(matrix, sk, Fp);

	const outputs = product.map((x, i) => (x + BigInt(error[i]) + BigInt(data[i])
		) % Fp);

	const w = await circuit.calculateWitness({matrix, outputs, comm: sk_comm, sk, sk_rand, error, data});

//	// Private inputs
//	signal input sk[M];
//	signal input sk_rand;
//	signal input error[N];
//	signal input data[N];
//
//	// Public inputs
//	signal input comm;
//	signal input matrix[N][M];
//


}


const lazyLoad = async () => {
	if (!mimcSponge || !F) {
		mimcSponge = await buildMimcSponge();
		F = mimcSponge.F;
	}
}

const genComm = async (sk, r) => {
	await lazyLoad()

	// Second argument is k (which we set to 0)
	const out = [mimcSponge.multiHash([...sk, r], 0, 1)]
	console.log(out)
	const outsSerial = out.map(o => F.toObject(o))

	return outsSerial[0]
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


genPubMatrix(config.N, config.M, 0).then(async matrix => {
	const error = generateWithNodeCrypto(config.N);
	const data = generateWithNodeCrypto(config.N);
	const sk = genSK(config.M);
	const sk_rand = 0; // TODO: Generate random value for real...
	const sk_comm = await genComm(sk, sk_rand);
	
	verify_circuit_test(matrix, sk_comm, sk, sk_rand, error, data)
})

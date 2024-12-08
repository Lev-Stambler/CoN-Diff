const config = require('./config');
const snarkjs = require("snarkjs");
const fs = require("fs");
const buildMimcSponge = require("circomlibjs").buildMimcSponge;

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



const genPubMatrix = async (N, M, prf_inp) => {
	const mimcSponge = await buildMimcSponge();
	const F = mimcSponge.F;

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


const perPartyVer = async (matrix, party_id) => {
	console.log("Verifying party", party_id, "with mat")
	const output = JSON.parse(
		fs.readFileSync(config.outputFilePath(party_id), "utf-8")
	);

	const pubSigs = JSON.parse(fs.readFileSync(config.pubSigFilePath(party_id), "utf-8"))
	const proof = JSON.parse(fs.readFileSync(config.proofFilePath(party_id), "utf-8"))
	const vKey = JSON.parse(fs.readFileSync("circuits/ver_key.json"), "utf-8");
	const res = await snarkjs.groth16.verify(vKey, 
		pubSigs
		, proof);
	console.log("Party", party_id, res)
	return res, output;
}

const aggregate = async (n_parties, prf_input) => {
	const mat = await genPubMatrix(config.N, config.M, prf_input)
	const reses = await Promise.all(new Array(n_parties).fill(0).map(async (_, i) => {
		await perPartyVer(mat, i + 1)
	}))
	if (!reses.every(r => r[0])){
		throw "Some parties failed"
	}
	const outputs = reses.map(r => r[1])
	const agg_output = outputs.reduce((a, b) => a + b, 0n)

	const agg_sk = config.deserializeBigInt(fs.readFileSync(config.AGG_SK_FILE_PATH, "utf-8"))
	const multed  = matrixVectorMultiply(mat, agg_sk, config.FIELD_SIZE)
	const ret = agg_output - multed
	return ret
}

aggregate(
	3,
	1n
).then(console.log)

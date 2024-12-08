const config = require('./config');
const snarkjs = require("snarkjs");
const fs = require("fs");
const { genPubMatrix, matrixVectorMultiply } = require('./prover');


const perPartyVer = async (matrix, party_id) => {
	const output = config.deserializeBigInt(
		fs.readFileSync(config.outputFilePath(party_id), "utf-8")
	);
	const proof = JSON.parse(fs.readFileSync(config.proofFilePath(party_id), "utf-8"))
	const pubSig = config.deserializeBigInt(fs.readFileSync(config.pubSigFilePath(party_id), "utf-8"))
	const res = await snarkjs.groth16.verify(vKey, {
		matrix,
		output,
		comm: pubSig,
	}, proof);
	console.log("Party i", res)
	return res, output;
}

const aggregate = async (n_parties, prf_input) => {
	const mat = await genPubMatrix(config.N, config.M, prf_input)
	const reses = await Promise.all(new Array(n_parties).fill(0).map(async (_, i) => {
		await perPartyVer(mat, i + 1)
	}))
	assert(reses.every(r => r[0]), "Some parties failed")
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

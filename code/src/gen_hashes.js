const path = require("path");
const wasm_tester = require("circom_tester").wasm;
const buildMimcSponge = require("circomlibjs").buildMimcSponge;

const K = 42

/**
 */
const hash_inps = async (inps, n_outs) => {
        mimcSponge = await buildMimcSponge();
        F = mimcSponge.F;
	// Second argument is k (which we set to 42)
	const out = mimcSponge.multiHash(inps, K, n_outs)
	const outsSerial = out.map(o => F.toObject(o))

	// console.log(out, outsSerial, typeof outsSerial[0])
	return outsSerial
}

hash_inps([0, 1, 2, 3], 3)

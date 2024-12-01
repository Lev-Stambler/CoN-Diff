// Code for the prover
let mimcSponge = null
let F = null

const lazyLoad = async () => {
	if (!mimcSponge || !F) {
		mimcSponge = await buildMimcSponge();
		F = mimcSponge.F;
	}
}

const genComm = async (sk, r) => {
	await lazyLoad()

	// Second argument is k (which we set to 0)
	const out = mimcSponge.multiHash([sk, r], 0, n_outs)
	const outsSerial = out.map(o => F.toObject(o))

	return outsSerial[1]
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
}

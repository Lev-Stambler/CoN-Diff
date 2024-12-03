const partyAgg = (sk, sk_rand, gradients, PRF_round) => {

	const data = generateWithNodeCrypto(config.N);
	const sk = genSK(config.M);
	const sk_rand = 0; // TODO: Generate random value for real...
	const sk_comm = await genComm(sk, sk_rand);
}

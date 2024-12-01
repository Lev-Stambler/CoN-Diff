pragma circom 2.0.0;
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/mimcsponge.circom";

template LWE(N, M) {
	var N_MAT_ELEMS = N * M;
	var N_ROUNDS = 220;

	// Private inputs
	signal input sk[M];
	signal input sk_rand;
	signal input error[N];
	signal input data[N];

	// Public inputs
	signal input comm;
	signal input output_comm;
	signal input prf_inp;
	signal input matrix[N][M];


	component hasher_comm = MiMCSponge(M + 1, N_ROUNDS, 1);
	hasher_comm.k <== 0;
	component hasher_output_comm = MiMCSponge(N, N_ROUNDS, 1);
	hasher_output_comm.k <== 0;

	// Helpers
	signal row_sum[N];
	signal _row_accumulator[N][M];

	// Compute the matrix-vector product
	for (var row = 0; row < N; row++) {
		_row_accumulator[row][0] <== matrix[row][0] * sk[0];
		for (var col = 1; col < M; col++) {
			_row_accumulator[row][col] <== _row_accumulator[row][col - 1] + matrix[row][col] * sk[col];
		}
		row_sum[row] <== _row_accumulator[row][M - 1];
	}

	// Verify the hashes
	for (var i = 0; i < M; i++) {
		hasher_comm.ins[i] <== sk[i];
	}
	hasher_comm.ins[M] <== sk_rand;
	comm === hasher_comm.outs[0];

	for (var i = 0; i < N; i++) {
		hasher_output_comm.ins[i] <== row_sum[i] + error[i] + data[i];
	}
	output_comm === hasher_output_comm.outs[0];

	//mat_gen[i * N_MAT_ELEMS + j].out;
}

component main = LWE(128, 128);


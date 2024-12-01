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


	component hasher_comm = MiMCSponge(M + 1, N_ROUNDS, 1);
	hasher_comm.k <== 42;
	component hasher_output_comm = MiMCSponge(N, N_ROUNDS, 1);
	hasher_output_comm.k <== 42;
	component mat_gen = MiMCSponge(2, N_ROUNDS, N_MAT_ELEMS);
	mat_gen.k <== 42;

	// Helpers
	signal row_sum[N];

	// Generate the matrix 
	mat_gen.ins[0] <== prf_inp;
	// Mimc expects at least 2 inputs. Set the second input to 0.
	mat_gen.ins[1] <== 0;

	// Compute the matrix-vector product
	for (var row = 0; row < N; row++) {
		row_sum[row] <== 0;
		for (var col = 0; col < M; col++) {
			row_sum[row] <== row_sum[row] + mat_gen.outs[row * N + col] * sk[col];
		}
		hasher_output_comm.ins[row] <== row_sum[row];
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
	//hasher_comm.ins[j] <== prf_inp * (N_MAT_ELEMS) + i * N + j;


}

component main = LWE(128, 128);


pragma circom 2.0.0;
include "../node_modules/circomlib/circuits/mimcsponge.circom";
include "../node_modules/circomlib/circuits/gates.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template CheckInSet() {
	signal input x;        // Input signal to check
	signal output isValid; // Output: 1 if x ∈ {-1, 0, 1}, 0 otherwise

	// Create components for equality checks
	component isNegOne = IsEqual();
	component isZero = IsEqual();
	component isOne = IsEqual();

	// Check if x == -1
	isNegOne.in[0] <== x;
	isNegOne.in[1] <== -1;

	// Check if x == 0
	isZero.in[0] <== x;
	isZero.in[1] <== 0;

	// Check if x == 1
	isOne.in[0] <== x;
	isOne.in[1] <== 1;

	// Combine results: x ∈ {-1, 0, 1} if any condition is true
	component orGateA = OR(); // Combine isNegOne and isZero
	orGateA.a <== isNegOne.out;
	orGateA.b <== isZero.out;

	component orGateB = OR(); // Combine orGate1 with isOne
	orGateB.a <== orGateA.out;
	orGateB.b <== isOne.out;

	// Final output
	isValid <== orGateB.out;
}


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
	signal input matrix[N][M];
	signal input outputs[N];


	component hasher_comm = MiMCSponge(M + 1, N_ROUNDS, 1);
	hasher_comm.k <== 0;

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

	// Verify range bounds on the error, for now, we use ternary error for efficiency
	component check_error[N];
	for (var i = 0; i < N; i++) {
		check_error[i] = CheckInSet();
		check_error[i].x <== error[i];
		check_error[i].isValid === 1;
	}

	// Verify the hashes
	for (var i = 0; i < M; i++) {
		hasher_comm.ins[i] <== sk[i];
	}
	hasher_comm.ins[M] <== sk_rand;
	comm === hasher_comm.outs[0];

	for (var i = 0; i < N; i++) {
		outputs[i] === row_sum[i] + error[i] + data[i];
	}

	//mat_gen[i * N_MAT_ELEMS + j].out;
}

component main {public [comm, outputs, matrix]} = LWE(80, 80);


# Code
All code lives in the `code` directory.
For the following, make sure to be in the `code` directory.

## Getting Started on the Code
First, make sure to have Node, Yarn, and Circom installed. 
Then,
```bash
cd code && yarn
```
to initialize the repository.

Also, to generate proofs:
```bash
npm install -g snarkjs
```

#### Running the files
First, adjust the `src/config.js` file to your needs. 

Then, to run the MPC setup code, first spin up the server for the duration of the MPC setup:
```bash
node src/server.js
```

Then, for each client, run the following for each party:
```bash
node src/client_setup.js <PARTY_NUMBER>
```
where `<PARTY_NUMBER>` is in $1, 2, \ldots, n$ where $n$ is the total number of parties.

To then run an iteration of the protocol, run the following for each party:
```bash
node src/prover.js <PARTY_NUMBER> <ITERATION_NUMBER>
```
where `<PARTY_NUMBER>` is in $1, 2, \ldots, n$ where $n$ is the total number of parties, and `<ITERATION_NUMBER>` is the iteration number.

Finally, to run the aggregation step, run the following:
```bash
node src/aggregator.js
```

# Acknowledgements
Thanks to Ian Miers for general feedback and guidance on the project.
Thank to Prof. Ryan O'Donnell for providing the initial `CSTheoryToolkitCMUStyle` and LaTeX template.


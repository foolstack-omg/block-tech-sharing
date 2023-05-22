import { Wallet, utils } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import * as dotenv from "dotenv"
dotenv.config()

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the contract`);

  // Initialize the wallet.
  const wallet = new Wallet(process.env.MAIN_WALLET_PRIVATE_KEY || process.exit(0));

  // Create deployer object and load the artifact of the contract you want to deploy.
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact("Wallet");
  let constructorArguments = []

  // Estimate contract deployment fee
  const deploymentFee = await deployer.estimateDeployFee(artifact, constructorArguments);

  // Deploy this contract. The returned object will be of a `Contract` type, similarly to ones in `ethers`.
  // `greeting` is an argument for contract constructor.
  const parsedFee = ethers.utils.formatEther(deploymentFee.toString());
  console.log(`The deployment is estimated to cost ${parsedFee} ETH`);

  const contract = await deployer.deploy(artifact, constructorArguments);

  //obtain the Constructor Arguments
  console.log("constructor args:" + contract.interface.encodeDeploy(constructorArguments));

  // Show the contract info.
  const contractAddress = contract.address;
  console.log(`${artifact.contractName} was deployed to ${contractAddress}`);

  // Verify the contract, so that it is opensource onchain.
  await hre.run("verify:verify", {
    address: contractAddress,
    contract: "contracts/Wallet.sol:Wallet",
    constructorArguments: constructorArguments
  });

}


import { run,ethers,network } from "hardhat";
import config from "../config";

async function main() {
  await run("compile");
  const networkName = network.name as  keyof typeof config.initialSupply;
  console.log(`Deploying to network ${networkName}`)
  const _Token = await ethers.getContractFactory("CORAI")
  console.log(`Deploying  TokenContract " CORAI "`)
  const Token = await  _Token.deploy(config.initialSupply[networkName],config.name[networkName],config.symbol[networkName],config.to[networkName],config.taxCollector[networkName])
  console.log(`CORAI deployed at: ${Token.address}`)
  await Token.deployed()
  try{
    await run("verify:verify", {
      address: Token.address,
      constructorArguments: [config.initialSupply[networkName],config.name[networkName],config.symbol[networkName],config.to[networkName],config.taxCollector[networkName]],
    })
  }catch(err:any){
    console.log(`error : ${err.message}`)
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

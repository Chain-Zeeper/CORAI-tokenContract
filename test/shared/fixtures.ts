
import {ethers} from "hardhat"

export async function tokenFixtures() {
    const initialSupply = ethers.BigNumber.from("1000000000000000000000000000")
    const [wallet,other] = await ethers.getSigners()
    const _CORAI = await ethers.getContractFactory("CORTX")

    const CORAI = await  _CORAI.deploy(initialSupply,"CORAI","CORAI",wallet.address)
    const role = await CORAI.limit_exempt()
    await CORAI.revokeRole(role,wallet.address)
    return {wallet,other,CORAI,initialSupply}   
}
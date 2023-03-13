import { BigNumber } from "ethers"
import {ethers} from "hardhat"

export async function tokenFixtures() {
    const initialSupply = BigNumber.from("1000000000000000000000000000")
    const [wallet,other] = await ethers.getSigners()
    const _CORAI = await ethers.getContractFactory("CORAI")

    const CORAI = await  _CORAI.deploy(initialSupply,"CORAI","CORAI",wallet.address,wallet.address)
    const role = await CORAI.tax_exempt()
    await CORAI.revokeRole(role,wallet.address)
    await CORAI.setBuyTaxPercentage(ethers.utils.parseEther("5"))
    await CORAI.setSaleTaxPercentage(ethers.utils.parseEther("5"))

    return {wallet,other,CORAI,initialSupply}   
}
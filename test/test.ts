import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { tokenFixtures } from "./shared/fixtures";
import { Contract, BigNumber, utils, constants } from "ethers"
const { MaxUint256 } = constants
const { hexlify, keccak256, defaultAbiCoder, toUtf8Bytes } = utils
import { getPermitSignature } from "./shared/utilities";
import { CORAI } from "../typechain-types";


describe("all test", async function () {
  let [wallet, other, pool, taxCollector]: any = [undefined, undefined]
  let AntiSnipe: CORAI
  let initialSupply: BigNumber
  let testAmount: BigNumber
  let deadAddress = "0x000000000000000000000000000000000000dEaD"
  beforeEach(async () => {
    [wallet, other, pool, taxCollector] = await ethers.getSigners()
    const fixture = await loadFixture(tokenFixtures)
    AntiSnipe = fixture.CORAI
    initialSupply = fixture.initialSupply
    testAmount = BigNumber.from("10000000")
  })


  it('name, symbol, decimals, totalSupply, balanceOf', async () => {
    const Tokenname = await AntiSnipe.name()
    expect(Tokenname).to.eq('CORAI')
    expect(await AntiSnipe.symbol()).to.eq('CORAI')
    expect(await AntiSnipe.decimals()).to.eq(18)
    expect(await AntiSnipe.totalSupply()).to.eq(initialSupply)
    expect(await AntiSnipe.balanceOf(wallet.address)).to.eq(initialSupply)
  })


  it('approve/permit', async () => {
    const { v, r, s } = await getPermitSignature(wallet, AntiSnipe, other.address, testAmount, MaxUint256)
    await expect(AntiSnipe.permit(wallet.address, other.address, testAmount, MaxUint256, v, r, s))
      .to.emit(AntiSnipe, 'Approval')
      .withArgs(wallet.address, other.address, testAmount)
    expect(await AntiSnipe.allowance(wallet.address, other.address)).to.eq(testAmount)

  })
  describe('transfer', async () => {
    it("CORAI", async () => {
      await expect(AntiSnipe.transfer(other.address, initialSupply.add(1))).to.be.reverted // ds-math-sub-underflow
      await expect(AntiSnipe.connect(other).transfer(wallet.address, 1)).to.be.reverted // ds-math-sub-underflow
      await expect(AntiSnipe.transfer(other.address, testAmount))
        .to.emit(AntiSnipe, 'Transfer')
        .withArgs(wallet.address, other.address, testAmount)
      expect(await AntiSnipe.balanceOf(wallet.address)).to.eq(initialSupply.sub(testAmount))
      expect(await AntiSnipe.balanceOf(other.address)).to.eq(testAmount)
    })

  })

  it('transferFrom', async () => {
    const { v, r, s } = await getPermitSignature(wallet, AntiSnipe, other.address, testAmount, MaxUint256)
    await expect(AntiSnipe.permit(wallet.address, other.address, testAmount, MaxUint256, v, r, s))
      .to.emit(AntiSnipe, 'Approval')
      .withArgs(wallet.address, other.address, testAmount)
    await expect(AntiSnipe.connect(other).transferFrom(wallet.address, other.address, testAmount))
      .to.emit(AntiSnipe, 'Transfer')
      .withArgs(wallet.address, other.address, testAmount)
    expect(await AntiSnipe.allowance(wallet.address, other.address)).to.eq(0)
    expect(await AntiSnipe.balanceOf(wallet.address)).to.eq(initialSupply.sub(testAmount))
    expect(await AntiSnipe.balanceOf(other.address)).to.eq(testAmount)
  })
  it('transferFrom:max',async () => {
    const { v, r, s } = await getPermitSignature(wallet, AntiSnipe, other.address, MaxUint256, MaxUint256)
    await expect(AntiSnipe.permit(wallet.address, other.address, MaxUint256, MaxUint256, v, r, s))
      .to.emit(AntiSnipe, 'Approval')
      .withArgs(wallet.address, other.address, MaxUint256)
    await expect(AntiSnipe.connect(other).transferFrom(wallet.address, other.address, testAmount))
      .to.emit(AntiSnipe, 'Transfer')
      .withArgs(wallet.address, other.address, testAmount)
    expect(await AntiSnipe.allowance(wallet.address, other.address)).to.eq(MaxUint256)
    expect(await AntiSnipe.balanceOf(wallet.address)).to.eq(initialSupply.sub(testAmount))
    expect(await AntiSnipe.balanceOf(other.address)).to.eq(testAmount)
  })

  it("Tokens burned", async () => {
    const { v, r, s } = await getPermitSignature(wallet, AntiSnipe, other.address, MaxUint256, MaxUint256)
    await expect(AntiSnipe.permit(wallet.address, other.address, MaxUint256, MaxUint256, v, r, s))
      .to.emit(AntiSnipe, 'Approval')
      .withArgs(wallet.address, other.address, MaxUint256)
    await expect(AntiSnipe.connect(other).transferFrom(wallet.address, other.address, testAmount))
      .to.emit(AntiSnipe, 'Transfer')
      .withArgs(wallet.address, other.address, testAmount)
    expect(await AntiSnipe.allowance(wallet.address, other.address)).to.eq(MaxUint256)
    expect(await AntiSnipe.balanceOf(wallet.address)).to.eq(initialSupply.sub(testAmount))
    expect(await AntiSnipe.balanceOf(other.address)).to.eq(testAmount)
  })

  it("max tx amountLower Bound",async()=>{
    expect(await AntiSnipe.getLowestPossibleTXLimit()).to.be.eq(ethers.utils.parseUnits("4000"));
    await expect(AntiSnipe.setMaxTxAmount(ethers.utils.parseUnits("3999"))).to.be.revertedWithCustomError(AntiSnipe,"invalidTxLimit")
    expect (await AntiSnipe.setMaxTxAmount(ethers.utils.parseUnits("4000"))).to.be.ok
    expect (await AntiSnipe.setMaxTxAmount(0)).to.be.ok
  })
  it("max tx Amount ", async () => {
    testAmount = ethers.utils.parseUnits("10000000")
    const poolRole = await AntiSnipe.liquidity_pool()
    const limitexempt = await AntiSnipe.limit_exempt()
   
    await AntiSnipe.approve(wallet.address, ethers.constants.MaxUint256)
    await AntiSnipe.connect(other).approve(wallet.address, ethers.constants.MaxUint256)
    await expect(AntiSnipe.connect(wallet).transferFrom(wallet.address, other.address, testAmount))
      .to.emit(AntiSnipe, 'Transfer')
    expect(await AntiSnipe.setMaxTxAmount(ethers.utils.parseUnits("60000"))).to.be.ok
    expect(await AntiSnipe.grantRole(poolRole, other.address)).to.be.ok
    await expect(AntiSnipe.connect(wallet).transferFrom(wallet.address, other.address, testAmount))
      .to.be.revertedWithCustomError(AntiSnipe, "overMaxLimit");
    await expect(AntiSnipe.connect(wallet).transferFrom(other.address, wallet.address, ethers.utils.parseUnits("60000")))
      .to.emit(AntiSnipe, 'Transfer')
    await expect(AntiSnipe.connect(wallet).transfer(other.address, testAmount))
      .to.be.revertedWithCustomError(AntiSnipe, "overMaxLimit");
    await expect(AntiSnipe.connect(other).transfer(wallet.address, ethers.utils.parseUnits("60000")))
      .to.emit(AntiSnipe, 'Transfer')
      await AntiSnipe.grantRole(limitexempt,wallet.address)
      await expect(AntiSnipe.connect(wallet).transferFrom(wallet.address, other.address, testAmount))
      .to.emit(AntiSnipe, 'Transfer')
  })
})



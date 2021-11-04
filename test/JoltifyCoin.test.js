// require("@nomiclabs/hardhat-web3"); // https://github.com/nomiclabs/hardhat/issues/1930

const ethers = require('ethers')

const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers')

const JoltifyCoin = artifacts.require('JoltifyCoin')
describe('Jolt staking test', _=>{ // "describe" can also be replaced by "contract"
  before(async ()=>{
    // this.token = await JoltifyCoin.deployed() // .deployed() is the same to .new() like below
    this.token = await JoltifyCoin.new()
    this.userAddress = '0xf721d978533be6c1135145929c12612c485d3b94'

    // next time run `truffle test`, these addresses keep the same to last time
    console.log('token address:', this.token.address)

    // uint256 returns to javascript is BN
    // use .capOfToken() not .capOfToken
    console.log('BN add test', (await this.token.capOfToken()).add(new BN(1)).toString() )
  })

  it('Should deploy contract properly', async ()=>{
    assert(''!==this.token.address) // if deploy fail, address would be empty string: ''
    assert(''!==this.staking.address)
  })

  it('Should be rejected if ment beyond cap', async ()=>{
    try { // mented success, test failed
      await this.token.mint(this.userAddress, (await this.token.capOfToken()).add(new BN(1)) ) // if .add(1), get failure
    } catch(e) { // mented failed, test success
      // console.log('e.message: ', e.message) // Returned error: VM Exception while processing transaction: revert ERC20Capped: cap exceeded -- Reason given: ERC20Capped: cap exceeded.
      assert(e.message.includes('ERC20Capped: cap exceeded'))
      return
    }
    assert(false)
  })

  it('Should ment proper amount', async ()=>{
    const amount = new BN(20211104)
    await this.token.mint(this.userAddress, amount)
    const balance = await this.token.balanceOf(this.userAddress)
    assert(amount.eq(balance)) // comparing between BigNumber need use .eq，not == or ===
  })

  // before allowed, should not ment by other address
})
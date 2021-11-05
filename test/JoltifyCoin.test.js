// https://testnet.bscscan.com/address/0xAB6e9204661c2c9E5d788Aa42F507cd2Eb868147#writeContract
// about supportsInterface: https://forum.openzeppelin.com/t/do-you-need-to-register-that-a-contract-supports-an-interface-using-erc165/6325

// const ethers = require('ethers')

const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers')

const JoltifyCoin = artifacts.require('JoltifyCoin')
describe('Joltify Coin Testing', _=>{ // "describe" can also be replaced by "contract"
  before(async ()=>{
    // this.token = await JoltifyCoin.deployed() // .deployed() is the same to .new() like below
    this.token = await JoltifyCoin.new()
    this.accounts = await web3.eth.getAccounts() // get all test accounts, accounts[0] is owner
    // console.log('this.accounts: ', this.accounts)

    this.address1 = this.accounts[1] // to test transfer, roles, 
    this.address2 = this.accounts[2] // to test approve and transforFrom

    /* need a user Provider? or change spender? */

    // every time run `truffle test`, contracts's addresses keep the same
    // console.log('token address:', this.token.address)

    this.tokenCap = await this.token.cap() // use .cap() not .cap
    console.log('this.token.cap(): ', this.tokenCap.toString() )

    this.DEFAULT_ADMIN_ROLE = await this.token.DEFAULT_ADMIN_ROLE()
    this.PAUSER_ROLE = await this.token.PAUSER_ROLE()
    this.MINTER_ROLE = await this.token.MINTER_ROLE()
    console.log('roles:', this.DEFAULT_ADMIN_ROLE, this.PAUSER_ROLE, this.MINTER_ROLE )

    // console.log('BN test:', (new BN('0xf')).toString() ) // not 15, BN can not work with hex
  })

  it('Multiple assert test', ()=>{ // all assert(true) will be passed, one of assert(false) will not be passed
    assert(true)
    assert(true)
    assert(true)
  })

  it('Should deploy contract properly', async ()=>{
    assert(''!==this.token.address) // if deploy fail, address would be empty string: ''
  })

  it('Should be rejected if ment beyond cap', async ()=>{
    try { // mented success, test failed
      await this.token.mint(this.address1, this.tokenCap.add(new BN(1)) ) // if .add(1), get failure. solidity uint256 returns to javascript is BN
    } catch(e) { // mented failed, test success
      // console.log('e.message: ', e.message) // Returned error: VM Exception while processing transaction: revert ERC20Capped: cap exceeded -- Reason given: ERC20Capped: cap exceeded.
      assert(e.message.includes('ERC20Capped: cap exceeded'))
      return
    }
    assert(false) // mint success run this
  }).timeout(10000) // default timeout is 2000ms, sometimes it is not enough. https://stackoverflow.com/questions/48411794/getting-error-error-timeout-of-2000ms-exceeded-for-async-tests-and-hooks-en

  it('Should mint proper amount', async ()=>{
    const amount = new BN(10000)
    await this.token.mint(this.address1, amount)
    const balance = await this.token.balanceOf(this.address1)
    const totalSupply = await this.token.totalSupply()
    assert(amount.eq(balance) && amount.eq(totalSupply)) // comparing between BigNumber need use .eq，not == or ===
  })

  it('Should transfer properly', async ()=>{
    const transferAmount = new BN(1000)
    await this.token.transfer(this.address2, transferAmount, {from: this.address1}) // success
    const balanceOfSpender = await this.token.balanceOf(this.address2)
    assert(balanceOfSpender.eq(transferAmount))
  })

  it('Should reject transferFrom before approved and work properly after approved', async ()=>{
    const transferAmount = new BN(75)
    try {
      await this.token.transferFrom(this.address1, this.address2, transferAmount, {from: this.address2}) // from means who to sign this tx
      assert(false)
    } catch(e) {
      // console.log(e.message) // Returned error: VM Exception while processing transaction: revert ERC20: transfer amount exceeds allowance -- Reason given: ERC20: transfer amount exceeds allowance.
      assert(e.message.includes('transfer amount exceeds allowance'))
      // approve and transferFrom again
      await this.token.approve(this.address2, transferAmount.mul(new BN(10)), {from: this.address1}) // addr1 appreve to addr2
      const balanceBefore = await this.token.balanceOf(this.address2)
      await this.token.transferFrom(this.address1, this.address2, transferAmount, {from: this.address2})
      const balanceAfter = await this.token.balanceOf(this.address2)
      assert(balanceBefore.add(transferAmount).eq(balanceAfter))
    }
  })

  it('Should increaseAllowance properly', async ()=>{
    const amount = new BN(1)
    const allowanceBefore = await this.token.allowance(this.address1, this.address2)
    await this.token.increaseAllowance(this.address2, amount, {from: this.address1})
    const allowanceAfter = await this.token.allowance(this.address1, this.address2)
    assert(allowanceBefore.add(amount).eq(allowanceAfter))
  })

  it('Should decreaseAllowance properly', async ()=>{
    const amount = new BN(1)
    const allowanceBefore = await this.token.allowance(this.address1, this.address2)
    await this.token.decreaseAllowance(this.address2, amount, {from: this.address1})
    const allowanceAfter = await this.token.allowance(this.address1, this.address2)
    assert(allowanceBefore.sub(amount).eq(allowanceAfter))
  })

  it('Should reject mint before grantRole to minter and work properly after grantRole to minter', async ()=>{
    const amount = new BN(1)
    const balanceBefore = await this.token.balanceOf(this.address2)
    try {
      await this.token.mint(this.address2, amount, {from: this.address1})
      assert(false)
    } catch(e) {
      // console.log(e.message) // Returned error: VM Exception while processing transaction: revert AccessControl: account 0xf17f52151ebef6c7334fad080c5704d77216b732 is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6 -- Reason given: AccessControl: account 0xf17f52151ebef6c7334fad080c5704d77216b732 is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6.
      assert(e.message.includes('is missing role'))
      await this.token.grantRole(this.MINTER_ROLE, this.address1)
      await this.token.mint(this.address2, amount, {from: this.address1})
      const balanceAfter = await this.token.balanceOf(this.address2)
      assert(balanceBefore.add(amount).eq(balanceAfter))
    }
  }).timeout(10000)

  it('Should reject pause before grantRole to pauser and work properly after grantRole to pauser', async ()=>{
    try {
      await this.token.pause({from: this.address1})
      assert(false)
    } catch(e) {
      // console.log(e.message) // Returned error: VM Exception while processing transaction: revert AccessControl: account 0xf17f52151ebef6c7334fad080c5704d77216b732 is missing role 0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a -- Reason given: AccessControl: account 0xf17f52151ebef6c7334fad080c5704d77216b732 is missing role 0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a.
      assert(e.message.includes('is missing role'))
      await this.token.grantRole(this.PAUSER_ROLE, this.address1)
      await this.token.pause({from: this.address1})
      let paused = await this.token.paused()
      assert(paused)
      await this.token.unpause({from: this.address1})
      paused = await this.token.paused()
      assert(!paused)
    }
  }).timeout(10000)

  // burnFrom need allowance like transforFrom
  it('Should burnFrom properly', async ()=>{
    const amount = new BN(1)
    const balanceBefore = await this.token.balanceOf(this.address1)
    const totalSupplyBefore = await this.token.totalSupply()
    await this.token.burnFrom(this.address1, amount, {from: this.address2})
    const balanceAfter = await this.token.balanceOf(this.address1)
    const totalSupplyAfter = await this.token.totalSupply()
    assert( balanceBefore.sub(amount).eq(balanceAfter) && totalSupplyBefore.sub(amount).eq(totalSupplyAfter) )
  })

  // burn caller's balance
  it('Should burn properly', async ()=>{
    const totalSupplyBefore = await this.token.totalSupply()
    const balanceBefore = await this.token.balanceOf(this.address1)
    const amount = new BN(1)
    try {
      await this.token.burn(balanceBefore.add(new BN(1)))
      assert(false)
    } catch(e) {
      // console.log(e.message) // Error: Returned error: VM Exception while processing transaction: revert ERC20: burn amount exceeds balance -- Reason given: ERC20: burn amount exceeds balance.
      assert(e.message.includes('burn amount exceeds balance'))
      await this.token.burn(amount, {from: this.address1}) // amount=1, burn amount exceeds balance?
      const totalSupplyAfter = await this.token.totalSupply()
      const balanceAfter = await this.token.balanceOf(this.address1)
      assert( balanceBefore.sub(amount).eq(balanceAfter) && totalSupplyBefore.sub(amount).eq(totalSupplyAfter) )
    }
  }).timeout(10000)

  it('Should reject if not admin to set and remove roles', async ()=>{
    try {
      await this.token.grantRole(this.PAUSER_ROLE, this.address2, {from: this.address1})
      assert(false)
    } catch(e) {
      // console.log(e.message) // Returned error: VM Exception while processing transaction: revert AccessControl: account 0xf17f52151ebef6c7334fad080c5704d77216b732 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000 -- Reason given: AccessControl: account 0xf17f52151ebef6c7334fad080c5704d77216b732 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000.
      assert(e.message.includes('is missing role'))
      try {
        await this.token.revokeRole(this.PAUSER_ROLE, this.address1, {from: this.address2})
        assert(false)
      } catch (e) {
        // console.log(e) // Returned error: VM Exception while processing transaction: revert AccessControl: account 0xf17f52151ebef6c7334fad080c5704d77216b732 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000 -- Reason given: AccessControl: account 0xf17f52151ebef6c7334fad080c5704d77216b732 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000.
        assert(e.message.includes('is missing role'))
      }
    }
  }).timeout(10000)

  it('Should renounceRole properly', async ()=>{
    let hasRole = await this.token.hasRole(this.PAUSER_ROLE, this.address1)
    assert(hasRole)
    await this.token.renounceRole(this.PAUSER_ROLE, this.address1, {from: this.address1})
    hasRole = await this.token.hasRole(this.PAUSER_ROLE, this.address1)
    assert(!hasRole)
  })

  it('Should revokeRole properly', async ()=>{
    let hasRole = await this.token.hasRole(this.MINTER_ROLE, this.address1)
    assert(hasRole)
    await this.token.revokeRole(this.MINTER_ROLE, this.address1) // onlyOnew can revokeRole
    hasRole = await this.token.hasRole(this.MINTER_ROLE, this.address1)
    assert(!hasRole)
  })

})
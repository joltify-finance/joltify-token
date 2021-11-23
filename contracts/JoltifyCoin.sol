// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

contract JoltifyCoin is ERC20Capped, ERC20Burnable, Pausable, AccessControl  {

    uint256 internal capOfToken = 500000000 * 10**decimals();
    address constant public MultisigContractAddress = 0x2B0417D30a5f00b67E1aBCFBE38F194d9c85AD48;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("JoltifyCoin", "JOLT") ERC20Capped( capOfToken ) {
        _setupRole(DEFAULT_ADMIN_ROLE, MultisigContractAddress);
        _setupRole(PAUSER_ROLE, MultisigContractAddress);
        _setupRole(MINTER_ROLE, MultisigContractAddress);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _mint(address account, uint256 amount) internal override(ERC20, ERC20Capped) {
        require(ERC20.totalSupply() + amount <= cap(), "ERC20Capped: cap exceeded");
        super._mint(account, amount);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
    
}
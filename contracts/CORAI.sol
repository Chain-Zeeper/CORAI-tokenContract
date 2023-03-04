// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error invalidTaxValue();
error overMaxLimit();
error overAllowedBalance();
contract CORAI is ERC20, ERC20Burnable,AccessControl,ERC20Permit,Ownable{
    address constant private NullAddress = 0x000000000000000000000000000000000000dEaD;
    bytes32 public constant liquidity_pool = keccak256("liquidity_pool");
    bytes32 public constant tax_exempt = keccak256("tax_exempt");
    uint256 constant public percision = 1e18; 
    uint256 public saleBurnPercentage = 15 * percision;
    uint256 public buyBurnPercentage = 0 * percision;
    address public burnAddress;
    uint256  public maxTxAmount;
    constructor(uint256 initialSupply,string memory name,string memory symbol,address to,address _burnAddress) ERC20(name, symbol)   ERC20Permit(name){
        _transferOwnership(to);
        _grantRole(DEFAULT_ADMIN_ROLE, to);
        _grantRole(tax_exempt, to);
        _grantRole(tax_exempt, _burnAddress);
        burnAddress = _burnAddress;
        _mint(to,initialSupply);
        maxTxAmount = 1000000000000000000000;
    }

    function totalSupply() public view  override returns (uint256) {
        uint256 _totalSupplyWithNull = super.totalSupply();
        uint256 _totalSupply = _totalSupplyWithNull - balanceOf(NullAddress);
        return _totalSupply;
    }

    function setBuyBurnPercentage(uint256 tax) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if(tax >( 100 *1e18)){
            revert invalidTaxValue();
        }
        buyBurnPercentage = tax;
    }
    function setSaleBurnPercentage(uint256 tax) external onlyRole(DEFAULT_ADMIN_ROLE){
        if(tax >( 100 *1e18)){
            revert invalidTaxValue();
        }
        saleBurnPercentage = tax;
    }
    function transferFrom(address from,address to,uint256 amount) public virtual override  returns (bool) {
        bool receiverIsLiquidityPool =  hasRole(liquidity_pool,to);
        bool senderIsLiquidityPool = hasRole(liquidity_pool, from);
        uint256 tax;
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        validAmount(amount,from,to);
        // sell from->user to->lp
        if(saleBurnPercentage!=0 && !senderIsLiquidityPool && burnAddress!= address(0) && receiverIsLiquidityPool && !hasRole(tax_exempt, from) ){            
            tax = (amount * saleBurnPercentage)/(100 * 1e18);
            _transfer(from, burnAddress, tax);
        }
        // buy from lp to user # note max tx amount will apply
        if(buyBurnPercentage!=0 && senderIsLiquidityPool && burnAddress!= address(0) && !receiverIsLiquidityPool && !hasRole(tax_exempt, to)){
            tax = (amount * buyBurnPercentage)/(100 * 1e18);
            _transfer(to, burnAddress, tax);         
        } 
        return true;
    }
    function setBurnAddress(address _burnAddress)external onlyRole(DEFAULT_ADMIN_ROLE){
        burnAddress = _burnAddress;
    }

    function transfer(address to, uint256 amount) public virtual override returns (bool)  {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        bool receiverIsLiquidityPool =  hasRole(liquidity_pool,to);  
        bool senderIsLiquidityPool = hasRole(liquidity_pool, owner);
        uint256 tax;
        validAmount(amount,msg.sender,to);
        // buy from lppool to user
        if(buyBurnPercentage!=0 && senderIsLiquidityPool && burnAddress!= address(0) && !receiverIsLiquidityPool && !hasRole(tax_exempt, to)){
            tax = (amount * buyBurnPercentage)/(100 * 1e18);
            _transfer(to, burnAddress, tax);         
        }
        // sell from user to lp
        if(saleBurnPercentage!=0 && !senderIsLiquidityPool && burnAddress!= address(0) && receiverIsLiquidityPool && !hasRole(tax_exempt, owner)){
            
            tax = (amount * saleBurnPercentage)/(100 * 1e18);
            _transfer(owner, burnAddress, tax);
        }
        return true;
    }
    function setMaxTxAmount (uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE){
        maxTxAmount = amount;
    }
    function validAmount(uint256 amount,address from,address to) internal view{
        bool receiverIsLiquidityPool =  hasRole(liquidity_pool,to);
        bool senderIsLiquidityPool = hasRole(liquidity_pool, from);
        if((receiverIsLiquidityPool && !senderIsLiquidityPool)
        && (amount > maxTxAmount && maxTxAmount!= 0 ) && !hasRole(tax_exempt, to) && !hasRole(tax_exempt, from)
        ){
            revert overMaxLimit();
        }
    }

}

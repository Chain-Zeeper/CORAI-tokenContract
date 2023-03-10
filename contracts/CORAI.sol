// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error invalidTaxValue();
error overMaxLimit();
error overAllowedBalance();
error zeroAddress();
/** 
* @title An ERC20 contract with tax and tx limit features
* @author sandwizard
* @dev Inherits the OpenZepplin ERC20 implentation
**/ 
contract CORAI is ERC20, ERC20Burnable,AccessControl,ERC20Permit,Ownable{
    /// @notice dead address used to burn tokens
    address constant private NullAddress = 0x000000000000000000000000000000000000dEaD;

    /// @notice liquidity_pool role identifier. used to apply tax on liquidity pools
    /// @dev for use with role based access control.from open zeeplin access control
    /// @return  liquidity_pool  role identifier
    bytes32 public constant liquidity_pool = keccak256("liquidity_pool");
    /// @notice tax exempt from all tax as well as tx limits. ues with mm wallets
    /// @return tax_exempt role identifier
    bytes32 public constant tax_exempt = keccak256("tax_exempt");

    /// @notice value used in calculations (calculations scaled up by percision )
    /// @dev for calculations for solidity floating point limitations
    /// @return  percision the value used in calculations scaled up by
    uint256 constant public percision = 1e18; 

    /// @notice sale tax applied on sell to liquidity pools
    /// @dev must grant liquidity pool role to be applied. is scaled by 1e18
    /// @return  saleTaxPercentage which is 1e18 * saletax
    uint256 public saleTaxPercentage = 15 * percision;

    /// @notice buy tax applied on buy from liquidity pools
    /// @dev must grant liquidity pool role to be applied. is scaled by 1e18
    /// @return  buyTaxPercentage whis is 1e18 * buytax
    uint256 public buyTaxPercentage = 0 * percision;

    
    /// @notice fee address wher tax is collected
    /// @return  feeAddress
    address public feeAddress;

    /// @notice max tx limit. only applied on sell to liquidity pool
    /// @return  maxTxAmount for sell to pools
    uint256  public maxTxAmount;

    /// @notice Deploys the smart contract and creates mints inital sypply to "to" address
    /// @dev owner ship is transfer on deployment and deployer address has no access to any admin functions
    /// @dev pass normal erc20 parameters such as symbol name. with to address and fee address
    constructor(uint256 _initialSupply,string memory _name,string memory _symbol,address _to,address _feeAddress) ERC20(_name, _symbol)   ERC20Permit(_name){
        if(_to == address(0)){
            revert zeroAddress();
        }
        _transferOwnership(_to);
        _grantRole(DEFAULT_ADMIN_ROLE, _to);
        _grantRole(tax_exempt, _to);
        _grantRole(tax_exempt, feeAddress);
        feeAddress= _feeAddress;
        _mint(_to,_initialSupply);
        maxTxAmount = 1000000000000000000000;
        
    }
    /** 
    * @return totalsupply factoring in burned tokens sent to dead address
    **/ 
    function totalSupply() public view  override returns (uint256) {
        uint256 _totalSupplyWithNull = super.totalSupply();
        uint256 _totalSupply = _totalSupplyWithNull - balanceOf(NullAddress);
        return _totalSupply;
    }
    /// @notice must pass 1e18* buytax 
    /// @dev onlu admin can access role
    function setBuyTaxPercentage(uint256 _buytax) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if(_buytax >( 100 *1e18)){
            revert invalidTaxValue();
        }
        buyTaxPercentage = _buytax;
    }
    /// @notice must pass 1e18* saletax 
    /// @dev onlu admin can access role
    function setSaleTaxPercentage(uint256 _saletax) external onlyRole(DEFAULT_ADMIN_ROLE){
        if(_saletax >( 100 *1e18)){
            revert invalidTaxValue();
        }
        saleTaxPercentage = _saletax;
    }
    
    /// @dev normal erc20 transferFrom function incase of wallet transfer
    /// @dev else tax and limit(only sale) is applied when a lp pool is involved
    /// @dev in case on both sender and receiver is lp pool no tax or limit applied
    function transferFrom(address from,address to,uint256 amount) public virtual override  returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        _transfeFees(from,to,amount);
        return true;
    }
    /// @notice set the fee where tax is colleted . zero address will stop all tax
    /// @dev only admin can change
    function setFeeAddress(address _feeAddress)external onlyRole(DEFAULT_ADMIN_ROLE){
        feeAddress = _feeAddress;
    }

    /// @dev normal erc20 transfer function incase of wallet transfer
    /// @dev else tax and limit(only sale) is applied when a lp pool is involved
    /// @dev in case on both sender and receiver is lp pool no tax or limit applied
    function transfer(address to, uint256 amount) public virtual override returns (bool)  {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        _transfeFees(owner,to,amount);
        return true;
    }
    /// @notice set the fee where txlimit in terms of token on sell to lp pools
    /// @dev  zetting to zero turns off limit
    /// @dev only admin can change
    function setMaxTxAmount (uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE){
        maxTxAmount = amount;
    }

    /// @dev  internal func to apply tx limit if sell to lp pool
    /// @dev ignored incase between lp pools
    function validAmount(uint256 amount,address from,address to) internal view{
        bool receiverIsLiquidityPool =  hasRole(liquidity_pool,to);
        bool senderIsLiquidityPool = hasRole(liquidity_pool, from);
        if((receiverIsLiquidityPool && !senderIsLiquidityPool)
        && (amount > maxTxAmount && maxTxAmount!= 0 ) && !hasRole(tax_exempt, to) && !hasRole(tax_exempt, from)
        ){
            revert overMaxLimit();
        }
    }

    function _transfeFees(address from,address to,uint256 amount) internal{
        validAmount(amount,from,to);
        bool receiverIsLiquidityPool =  hasRole(liquidity_pool,to);
        bool senderIsLiquidityPool = hasRole(liquidity_pool, from);
        uint256 tax;
        if(saleTaxPercentage!=0 && !senderIsLiquidityPool && feeAddress!= address(0) && receiverIsLiquidityPool && !hasRole(tax_exempt, from) ){            
            tax = (amount * saleTaxPercentage)/(100 * 1e18);
            _transfer(from, feeAddress, tax);
        }
        // buy from lp to user # note max tx amount will apply
        if(buyTaxPercentage!=0 && senderIsLiquidityPool && feeAddress!= address(0) && !receiverIsLiquidityPool && !hasRole(tax_exempt, to)){
            tax = (amount * buyTaxPercentage)/(100 * 1e18);
            _transfer(to, feeAddress, tax);         
        } 
    }
}

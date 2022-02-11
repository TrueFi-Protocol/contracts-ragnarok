// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {IBulletLoans} from "./interfaces/IBulletLoans.sol";
import {IProtocolConfig} from "./interfaces/IProtocolConfig.sol";
import {IManagedPortfolio} from "./interfaces/IManagedPortfolio.sol";
import {IERC20WithDecimals} from "./interfaces/IERC20WithDecimals.sol";
import {ILenderVerifier} from "./interfaces/ILenderVerifier.sol";
import {InitializableManageable} from "./access/InitializableManageable.sol";
import {ProxyWrapper} from "./proxy/ProxyWrapper.sol";

contract ManagedPortfolioFactory is InitializableManageable {
    IBulletLoans public bulletLoans;
    IProtocolConfig public protocolConfig;
    IManagedPortfolio public portfolioImplementation;
    IManagedPortfolio[] public portfolios;

    mapping(address => bool) public isWhitelisted;

    event PortfolioCreated(IManagedPortfolio newPortfolio, address manager);
    event WhitelistChanged(address account, bool whitelisted);
    event PortfolioImplementationChanged(IManagedPortfolio newImplementation);

    constructor() InitializableManageable(msg.sender) {}

    function initialize(
        IBulletLoans _bulletLoans,
        IProtocolConfig _protocolConfig,
        IManagedPortfolio _portfolioImplementation
    ) external {
        InitializableManageable.initialize(msg.sender);
        bulletLoans = _bulletLoans;
        protocolConfig = _protocolConfig;
        portfolioImplementation = _portfolioImplementation;
    }

    function setIsWhitelisted(address account, bool _isWhitelisted) external onlyManager {
        isWhitelisted[account] = _isWhitelisted;
        emit WhitelistChanged(account, _isWhitelisted);
    }

    function setPortfolioImplementation(IManagedPortfolio newImplementation) external onlyManager {
        portfolioImplementation = newImplementation;
        emit PortfolioImplementationChanged(newImplementation);
    }

    function createPortfolio(
        string memory name,
        string memory symbol,
        IERC20WithDecimals _underlyingToken,
        ILenderVerifier _lenderVerifier,
        uint256 _duration,
        uint256 _maxSize,
        uint256 _managerFee
    ) external {
        require(isWhitelisted[msg.sender], "ManagedPortfolioFactory: Caller is not whitelisted");
        bytes memory initCalldata = abi.encodeWithSelector(
            IManagedPortfolio.initialize.selector,
            name,
            symbol,
            msg.sender,
            _underlyingToken,
            bulletLoans,
            protocolConfig,
            _lenderVerifier,
            _duration,
            _maxSize,
            _managerFee
        );
        IManagedPortfolio newPortfolio = IManagedPortfolio(address(new ProxyWrapper(address(portfolioImplementation), initCalldata)));
        portfolios.push(newPortfolio);
        emit PortfolioCreated(newPortfolio, msg.sender);
    }

    function getPortfolios() external view returns (IManagedPortfolio[] memory) {
        return portfolios;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PlayGame is Ownable, ReentrancyGuard {
    enum Status { EMPTY, CREATED, STAKED, SETTLED, REFUNDED }

    struct Match {
        address p1;
        address p2;
        uint256 stake;
        uint256 startTime;
        uint8 state;
        bool staked1;
        bool staked2;
    }

    mapping(bytes32 => Match) public matches;
    address public operator;
    IERC20 public gameToken;
    uint256 public timeout = 24 hours;

    event MatchCreated(bytes32 indexed matchId, address p1, address p2, uint256 stake);
    event Staked(bytes32 indexed matchId, address who, uint256 stake);
    event Settled(bytes32 indexed matchId, address winner, uint256 payout);
    event Refunded(bytes32 indexed matchId);

    modifier onlyOperator() {
        require(msg.sender == operator, "Not operator");
        _;
    }

    constructor(address _gameToken, address _operator) Ownable(msg.sender) {
        require(_gameToken != address(0) && _operator != address(0), "Zero address");
        gameToken = IERC20(_gameToken);
        operator = _operator;
    }

    function setOperator(address _op) public onlyOwner {
        require(_op != address(0), "Zero address");
        operator = _op;
    }

    function createMatch(bytes32 matchId, address p1, address p2, uint256 stake) external onlyOwner {
        require(matches[matchId].state == uint8(Status.EMPTY), "Match exists");
        require(p1 != address(0) && p2 != address(0) && p1 != p2, "Bad players");
        require(stake > 0, "Stake zero");
        matches[matchId] = Match({
            p1: p1,
            p2: p2,
            stake: stake,
            startTime: 0,
            state: uint8(Status.CREATED),
            staked1: false,
            staked2: false
        });
        emit MatchCreated(matchId, p1, p2, stake);
    }

    function stakes(bytes32 matchId) external nonReentrant {
        Match storage m = matches[matchId];
        require(m.state == uint8(Status.CREATED), "Not creatable");
        require(msg.sender == m.p1 || msg.sender == m.p2, "Not player");

        // Pull stake
        require(gameToken.allowance(msg.sender, address(this)) >= m.stake, "Approve GT first");
        require(gameToken.transferFrom(msg.sender, address(this), m.stake), "TransferFrom fail");

        if (msg.sender == m.p1) {
            require(!m.staked1, "Already staked p1");
            m.staked1 = true;
        } else {
            require(!m.staked2, "Already staked p2");
            m.staked2 = true;
        }
        emit Staked(matchId, msg.sender, m.stake);

        if (m.staked1 && m.staked2) {
            m.state = uint8(Status.STAKED);
            m.startTime = block.timestamp;
        }
    }

    function commitResult(bytes32 matchId, address winner) external onlyOperator nonReentrant {
        Match storage m = matches[matchId];
        require(m.state == uint8(Status.STAKED), "Not staked");
        require(winner == m.p1 || winner == m.p2, "Not a player");
        uint256 payout = m.stake * 2;

        // Transfer payout
        require(gameToken.transfer(winner, payout), "Payout failed");

        m.state = uint8(Status.SETTLED);
        emit Settled(matchId, winner, payout);
    }

    function refund(bytes32 matchId) external nonReentrant {
        Match storage m = matches[matchId];
        require(m.state == uint8(Status.STAKED), "Not staked");
                require(block.timestamp >= m.startTime + timeout, "Timeout not reached");
        require(m.staked1 && m.staked2, "Not both staked");

        // Refund to both players
        require(gameToken.transfer(m.p1, m.stake), "Refund p1 failed");
        require(gameToken.transfer(m.p2, m.stake), "Refund p2 failed");
        m.state = uint8(Status.REFUNDED);
        emit Refunded(matchId);
    }

    function setTimeout(uint256 sec) external onlyOwner {
        timeout = sec;
    }

    function getStatus(bytes32 matchId) external view returns (Status) {
        return Status(matches[matchId].state);
    }
}

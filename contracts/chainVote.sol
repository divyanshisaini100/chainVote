// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ChainVote {
    struct Poll {
        string question;
        string[] options;
        address creator;
        uint256 deadline;
        bool exists;
    }

    mapping(uint256 => Poll) public polls;
    mapping(uint256 => mapping(uint256 => uint256)) public votes;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    uint256 public pollCount;

    event PollCreated(uint256 indexed pollId, string question);
    event Voted(uint256 indexed pollId, address indexed voter, uint256 optionIndex);

    function createPoll(
        string memory _question,
        string[] memory _options,
        uint256 _durationMinutes
    ) public {
        require(_options.length >= 2, "Need at least 2 options");
        require(_durationMinutes > 0, "Duration must be > 0");

        uint256 pollId = pollCount;
        polls[pollId] = Poll({
            question: _question,
            options: _options,
            creator: msg.sender,
            deadline: block.timestamp + (_durationMinutes * 1 minutes),
            exists: true
        });
        pollCount++;
        emit PollCreated(pollId, _question);
    }

    function vote(uint256 _pollId, uint256 _optionIndex) public {
        Poll storage p = polls[_pollId];
        require(p.exists, "Poll does not exist");
        require(block.timestamp < p.deadline, "Voting ended");
        require(!hasVoted[_pollId][msg.sender], "Already voted");
        require(_optionIndex < p.options.length, "Invalid option");

        hasVoted[_pollId][msg.sender] = true;
        votes[_pollId][_optionIndex]++;
        emit Voted(_pollId, msg.sender, _optionIndex);
    }

    function getOptions(uint256 _pollId) public view returns (string[] memory) {
        return polls[_pollId].options;
    }

    function getResults(uint256 _pollId) public view returns (uint256[] memory) {
        uint256[] memory results = new uint256[](polls[_pollId].options.length);
        for (uint256 i = 0; i < results.length; i++) {
            results[i] = votes[_pollId][i];
        }
        return results;
    }
}
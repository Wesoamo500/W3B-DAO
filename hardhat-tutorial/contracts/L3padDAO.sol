// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "openzeppelin/contracts/access/Ownable.sol";
 
interface IFakeNFTMarketPlace {
    function purchase(uint256 _tokenId) external payable;
    function getPrice() external view returns (uint256);
    function available(uint256 _tokenId) external view returns (bool);
}

interface ICryptoDevsNFT{
    function balanceOf(address owner) external view returns (uint256);

    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);

}

contract L3padDAO is Ownable {

    enum Vote {YAY, NAY}
    struct Proposal{
        uint256 nftTokenId;

        uint256 deadline;

        uint256 yayVotes;
        uint256 nayVotes;

        bool executed;

        mapping(uint256 => bool) voters;
    } 

    mapping(uint256 => Proposal) public proposals;
    uint256 public numProposals;

    IFakeNFTMarketPlace nftMarketplace;
    ICryptoDevsNFT cryptoDevsNFT;

    constructor(address _nftMarketplace, address _cryptodevsNft) payable {
        nftMarketplace = IFakeNFTMarketPlace(_nftMarketplace);
        cryptoDevsNFT = ICryptoDevsNFT(_cryptodevsNft);
    }

    modifier nftHolderOnly(){
        require(cryptoDevsNFT.balanceOf(msg.sender)>0, "Not a DAO member");
        _;
    }
    // create a proposal - member only

    function createProposal(uint256 _nftTokenId) external nftHolderOnly returns (uint256){
        require(nftMarketplace.available(_nftTokenId),"NFT not for sale");

        Proposal storage proposal = proposals(numProposals);
        proposal.nftTokenId = _nftTokenId;
        proposal.deadline = block.timestamp + 5 minutes;

        numProposals++;

        return numProposals - 1;
    }
    // vote on a proposal - member only
    function voteOnProposal(uint256 proposalId, Vote vote) external nftHolderOnly{
        
    }
    // execute the proposal - member only
}
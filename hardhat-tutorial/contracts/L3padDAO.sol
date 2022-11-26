// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
 
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

    modifier activeProposalOnly(uint256 proposalId){
        require(proposals[proposalId].deadline > block.timestamp, "Proposal Inactive");
        _;
    }

    modifier inactiveProposalOnly(uint256 proposalId){
        require(proposals[proposalId].deadline <= block.timestamp, "Proposal Active");
        require(proposals[proposalId].executed == false, "Already Executed"); 
        _;
    }
    // create a proposal - member only

    function createProposal(uint256 _nftTokenId) external nftHolderOnly returns (uint256){
        require(nftMarketplace.available(_nftTokenId),"NFT not for sale");

        Proposal storage proposal = proposals[numProposals];
        proposal.nftTokenId = _nftTokenId;
        proposal.deadline = block.timestamp + 5 minutes;

        numProposals++;

        return numProposals - 1;
    }
    // vote on a proposal - member only
    function voteOnProposal(uint256 proposalId, Vote vote) external nftHolderOnly activeProposalOnly(proposalId){
        Proposal storage proposal = proposals[proposalId];

        uint256 voterNFTBalance = cryptoDevsNFT.balanceOf(msg.sender);

        uint256 numVotes;

        for(uint256 i=0; i < voterNFTBalance; ++i){
            uint256 tokenId = cryptoDevsNFT.tokenOfOwnerByIndex(msg.sender, i);
            if(proposal.voters[tokenId] == false){
                numVotes++;
                proposal.voters[tokenId] = true;
            }
        }

        require(numVotes > 0, "Already voted");

        if (vote == Vote.YAY){
            proposal.yayVotes += numVotes;
        }else{
            proposal.nayVotes += numVotes;
        }

    }
    // execute the proposal - member only
    function executeProposal(uint256 proposalId) external nftHolderOnly inactiveProposalOnly(proposalId){
        Proposal storage proposal = proposals[proposalId];

        // Did the proposal pass?
        if(proposal.yayVotes > proposal.nayVotes){
            uint256 nftPrice = nftMarketplace.getPrice();
            require(address(this).balance >= nftPrice, "Not enough funds");
            nftMarketplace.purchase{value: nftPrice}(proposal.nftTokenId);
        }

        proposal.executed = true; 
    }

    function withdrawEther() external onlyOwner{
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}

    fallback() external payable {}
}
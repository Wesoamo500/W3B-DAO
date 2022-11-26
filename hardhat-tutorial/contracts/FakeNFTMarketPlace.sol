// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract FakeNFTMarketPlace{
    // maps tokenIds to Owners
    mapping(uint256 => address) public tokens;

    uint256 nftPrice = 0.001 ether;

    // purchase() takes some ETH, and marks the msg.sender address
    //  as the owner of some NFT
    function purchase(uint256 _tokenId) external payable {
        require(msg.value == nftPrice, "Insufficient funds");
        require(tokens[_tokenId]==address(0),"Not for sale");

        tokens[_tokenId] = msg.sender;
    }

    function getPrice() external view returns (uint256){
        return nftPrice;
    }

    function available(uint256 _tokenId) external view returns (bool) {
        if(tokens[_tokenId] == address(0)){
            return true;
        }
        return false;
    }
}

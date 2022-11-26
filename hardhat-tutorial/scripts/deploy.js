const {ethers} = require("hardhat");

const {CRYPTO_DEVS_NFT_CONTRACT_ADDRESS} = require(".constants./constants")

async function main(){
  const FakeNFTMarketPlace = await ethers.getContractFactory("FakeNFTMarketPlace");

  const fakeNftMarketplace = await FakeNFTMarketPlace.deploy();

  await fakeNftMarketplace.deployed();

  console.log(`FakeNFTMarketplace contract address: ${fakeNftMarketplace.address}`);
  
  const L3padDAO = await ethers.getContractFactory("L3padDAO");
  const l3padDAO = await L3padDAO.deploy(
    fakeNftMarketplace.address,
    CRYPTO_DEVS_NFT_CONTRACT_ADDRESS,
    {
      value: ethers.utils.parseEther("0.01")
    }
  );
  await l3padDAO.deployed();

  console.log(`L3padDAO contract address: ${l3padDAO.address}`);

}

main().then(()=>process.exit(0)).catch((error)=>{
  console.log(error);
  process.exit(1);
});
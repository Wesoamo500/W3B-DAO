import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import {Contract, providers} from "ethers"
import Web3modal from 'web3modal'
import {L3PAD_DAO_CONTRACT,L3PAD_DAO_ABI,CRYPTO_DEV_NFT_ABI,CRYPTO_DEV_NFT_CONTRACT} from "../constants"

import styles from '../styles/Home.module.css'
import { formatEther } from 'ethers/lib/utils'


export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false)
  const [loading,setLoading] = useState(false);
  const web3ModalRef = useRef();
  const [treasuryBalance, setTreasuryBalance] = useState("0")
  const [nftBalance,setNftBalance] = useState(0)
  const [numProposals, setNumProposals] = useState("0")
  const [fakeNftTokenId, setFakeNftTokenId] = useState(" ");
  const [proposals, setProposals] = useState([]);
  const [selectedTabs, setSelectedTabs] = useState("")

  // HELPER function to get the instance of the DAO contract
  const getDAOContractInstance = (providerOrSigner) =>{
    return new Contract(
      L3PAD_DAO_CONTRACT,
      L3PAD_DAO_ABI,
      providerOrSigner
    )
  }
  // HELPER function to get the instance of the Crypto devs NFT contract
  const getCryptoDevNFTContractInstance = (providerOrSigner)=>{
    return new Contract(
      CRYPTO_DEV_NFT_CONTRACT,
      CRYPTO_DEV_NFT_ABI,
      providerOrSigner
    )
  };


  // reads the remaining balnce of the DAO contract and sets the 'treasuryBalance variable'
  const getDAOTreasuryBalance =async () =>{
    try {
      const provider = await getProviderOrSigner();
      const balance = await provider.getBalance(L3PAD_DAO_CONTRACT);
      setTreasuryBalance(balance.toString())
    } catch (error) {
      console.log(error)
    }
  }

  // reads the balance of the crypto devs nft of the connected wallet and set the 'nftBalance variable'
  const getNFTBalance = async()=>{
    try {
      const signer = await getProviderOrSigner(true)
      const nftContract = getCryptoDevNFTContractInstance(signer);
      const balance = await nftContract.balanceOf(signer.getAddress());
      setNftBalance(parseInt(balance.toString()));
    } catch (error) {
      console.log(error)
    }
  }


  // gets the number of proposals of the DAO contract and set the 'numProposals variable'
  const getNumProposalsInDAO = async() =>{
    try {
      const provider = await getProviderOrSigner();
      const daoContract = getDAOContractInstance(provider);
      const _numProposals = await daoContract.numProposals();
      setNumProposals(_numProposals.toString());
    } catch (error) {
      console.log(error)
    }
  }

  // calls 'createProposal()' from the contract using the tokenId from the fakeNftTokenId
  const createProposal = async()=>{
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDAOContractInstance(signer);
      const txn = await daoContract.createProposal(fakeNftTokenId);
      setLoading(true)
      await txn.wait()
      await getNumProposalsInDAO();
      setLoading(false)
    } catch (error) {
      console.log(error)
      window.alert(error.message)
    }
  }

  // Helper function to fetch and parse one proposal from the dao contract given the id, converts the returned data
  // into js objects

  const fetchProposalById = async(id) =>{
    try {
      const provider = await getProviderOrSigner();
      const daoContract = getDAOContractInstance(provider);
      const proposal = await daoContract.proposals(id);
      const parsedProposal = {
        proposalId : id,
        nftTokenId : proposal.nftTokenId.toString(),
        deadline : new Date(parseInt(proposal.deadline.toString())*1000),
        yayVotes: proposal.yayVotes.toString(),
        nayVotes: proposal.nayVotes.toString(),
        executed: proposal.executed
      }
      return parsedProposal;
    } catch (error) {
      console.log(error)
    }
  }

  // looping through the proposals to set the 'proposal' variables
  const fetchAllProposals = async()=>{
    try {
      const proposals = []
      for(let i=0;i<numProposals;i++){
        const proposal = fetchProposalById(i);
        proposals.push(proposal)
      }
      setProposals(proposals)
      return proposals
    } catch (error) {
      console.log(error)
    }
  }

  // calls the function from the smart contract: function to vote on proposals takes the proposalId and the vote
  const voteOnProposals = async(proposalId, _vote) =>{
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDAOContractInstance(signer)

      let vote = _vote === "YAY" ? 0 : 1;
      const txn = await daoContract.voteOnProposal(proposalId,vote);
      setLoading(true)
      await txn.wait();
      setLoading(false);
      await fetchAllProposals();
    } catch (error) {
      console.log(error)
      window.alert(error.message)
    }
  }

  const executeProposal = async(proposalId) =>{
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDAOContractInstance(signer);
      const txn = await daoContract.executeProposal(proposalId);
      setLoading(true);
      await txn.wait();
      setLoading(false);
      await fetchAllProposals()
    } catch (error) {
      console.log(error)
      window.alert(error.message)
    }
  }

  const getProviderOrSigner = async(needSigner=false) =>{
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const {chainId} = await web3Provider.getNetwork();
    if(chainId!==5){
      window.alert("Please choose Goerli network");
      throw new Error("Please choose Goerli network");
    }
    if (needSigner){
      const signer = web3Provider.getSigner();
      return signer
    }
    return web3Provider
  }

  const connectWallet = async() =>{
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(()=>{
    if(!walletConnected){
      web3ModalRef.current = new Web3modal(
        {
          network:goerli,
          providerOptions: {},
          disableInjectedProvider: false
        }
      )
    }
    connectWallet().then(()=>{
      getDAOTreasuryBalance(),
      getNFTBalance(),
      getNumProposalsInDAO()
    })
  },[walletConnected])


  useEffect(()=>{
    if(selectedTabs === "View Proposals"){
      fetchAllProposals()
    }
  },[selectedTabs])

  function renderTabs(){
    if(selectedTabs === "Create Proposal"){
      return renderCreateProposalTab()
    }else if(selectedTabs === "View Proposals"){
      return renderViewProposals()
    }
    return null;
  }

  function renderCreateProposalTab(){
    if(loading){
      return(
        <div className={styles.description}>
          Loading... Transaction in process
        </div>
      )
    }else if(nftBalance === 0){
      return(
        <div className={styles.description}>
          You do not own an NFT <br/>
          <b>People who own an NFT can parttake in the voting process</b>
        </div>
      )
    }else{
      return(
        <div className={styles.container}>
          <label>Fake NFT token ID to purchase: </label>
          <input placeholder='0' type='number' onChange={(e)=>setFakeNftTokenId(e.target.value)}/>
          <button className={styles.button2} onClick={createProposal}>Create</button>
        </div>
      )
    }
  };

  function renderViewProposals(){
    if(loading){
      return(
        <div className={styles.description}>
          Loading... Waiting for transactions...
        </div>
      )
    }else if(proposals.length===0){
      return(
        <div className={styles.description}>
          No Proposal has been created yet
        </div>
      )
    }else{
      return(
        <div>
          {proposals.map((p,index)=>(
            <div className={styles.proposalCard} key={index}>
              <p>Proposal ID: {p.proposalId}</p>
              <p>Fake NFT to purchase: {p.nftTokenId}</p>
              <p>Deadline: {p.deadline.toLocaleString()}</p>
              <p>Yay Votes: {p.yayVotes}</p>
              <p>Nay Votes: {p.NayVotes}</p>
              <p>Executed?: {p.executed.toString()}</p>
              {p.deadline.getTime() > Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button className={styles.button2} onClick={()=>voteOnProposals(p.proposalId, "YAY")}>
                    Vote YAY
                  </button>
                  <button className={styles.button2} onClick={()=>voteOnProposals(p.proposalId, "NAY")}>
                    Vote NAY
                  </button>
                </div>
              ):p.deadline.getTime() < Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button className={styles.button2} onClick={()=>executeProposal(p.proposalId)}>
                    Execute Proposal {" "}
                    {p.yayVotes > p.nayVotes ? ("YAY") : ("NAY")}
                  </button>
                </div>
              ) : (
                <div className={styles.description}>Proposal Executed</div>
              )}
            </div>
          ))}
        </div>
      )
    }
  }

  return (
    <div>
      <Head>
        <title>L3pad Onchain DAO </title>
        <meta name="description" content="DAO app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to L3PAD</h1>
          <div className={styles.description}>Welcome to DAO</div>
          <div className={styles.description}>
            Your L3pad NFT balance: {nftBalance}
            <br/>
            Treasury Balance: {formatEther(treasuryBalance)} ETH
            <br/>
            Total number of Proposals: {numProposals}
          </div>
          <div className={styles.flex}>
            <button className={styles.button} onClick={()=>setSelectedTabs("Create Proposal")}>Create Proposal</button>
            <button className={styles.button} onClick={()=>setSelectedTabs("View Proposals")}>View Proposals</button>
          </div>
          {renderTabs()}
        </div>
        <div>
          <img className={styles.image} src='/DAO.png'/>
        </div>
      </div>
    </div>
  )
}

const keccak256 = require("keccak256")
const { MerkleTree } = require("merkletreejs")
const { WHITELIST_ADDRESS } = require("./white_list")
const addressLeaves = WHITELIST_ADDRESS.map(x => keccak256(x))
const merkleTree = new MerkleTree(addressLeaves, keccak256, {
    sortPairs : true
})

console.log(merkleTree.getHexProof(keccak256('0xEC56590C7839c7bC1be3dc75ed472352381B9ABa')))
console.log(merkleTree.verify(merkleTree.getHexProof(keccak256('0xEC56590C7839c7bC1be3dc75ed472352381B9ABa')), keccak256('0xEC56590C7839c7bC1be3dc75ed472352381B9ABa'), merkleTree.getHexRoot()))

/** Solidity
 * import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
 * bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
 * require(MerkleProof.verify(proof, merkleRootNFT, leaf), "Wallet not eligible to claim");
 */
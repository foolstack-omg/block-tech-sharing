require("dotenv").config();
const axios = require('axios')
const tokenMessengerAbi = require('../abis/cctp/TokenMessenger.json');
const usdcAbi = require('../abis/erc-20.json');
const messageTransmitterAbi = require('../abis/cctp/MessageTransmitter.json');
const ethers = require('ethers')

let $network_config = {
    MainNet: {
        AttestationServiceApi: 'https://iris-api.circle.com',
        Ethereum: {
            rpc: `https://rpc.ankr.com/eth`,
            domain: 0,
            tokenMessenger: '0xbd3fa81b58ba92a82136038b25adec7066af3155',
            messageTransmitter: '0x0a992d191deec32afe36203ad87d7d289a738f81',
            usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
        },
        Avalanche: {
            rpc: `https://rpc.ankr.com/avalanche`,
            domain: 1,
            tokenMessenger: '0x6b25532e1060ce10cc3b0a99e5683b91bfde6982',
            messageTransmitter: '0x8186359af5f57fbb40c6b14a588d2a59c0c29880',
            usdcAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
        },
        Arbitrum: {
            rpc: `https://rpc.ankr.com/arbitrum`,
            domain: 3,
            tokenMessenger: '0x19330d10D9Cc8751218eaf51E8885D058642E08A',
            messageTransmitter: '0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca',
            usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
        },
    },
    TestNet: {
        AttestationServiceApi: 'https://iris-api-sandbox.circle.com',
        Ethereum: {
            rpc: `https://rpc.ankr.com/eth_goerli`,
            domain: 0,
            tokenMessenger: '0xd0c3da58f55358142b8d3e06c1c30c5c6114efe8',
            messageTransmitter: '0x26413e8157cd32011e726065a5462e97dd4d03d9',
            usdcAddress: '0x07865c6e87b9f70255377e024ace6630c1eaa37f'
        },
        Avalanche: {
            domain: 1,
            tokenMessenger: '0xeb08f243e5d3fcff26a9e38ae5520a669f4019d0',
            messageTransmitter: '0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79',
            usdcAddress: '0x5425890298aed601595a70AB815c96711a31Bc65'
        },
        Arbitrum: {
            domain: 3,
            tokenMessenger: '0x12dcfd3fe2e9eac2859fd1ed86d2ab8c5a2f9352',
            messageTransmitter: '0x109bc137cb64eab7c0b1dddd1edf341467dc2d35',
            usdcAddress: '0xfd064A18f3BF249cf1f87FC203E90D8f650f2d63'
        },
    }
}

/**
 * @param {object} $network_config
 * @param {string} $network_type MainNet | TestNet
 * @param {string} $from_network Ethereum | Avalanche | Arbitrum
 * @param {string} $to_network Ethereum | Avalanche | Arbitrum
 * @param {string} $from_pk Private key of the wallet which to bridge out token
 * @param {string} $to_pk Private key of the wallet which to transfer token to recipient
 * @param {ethers.BigNumber} $amount Amount that will be transferred
 * @param {string} $recipient Address to receive the amount, if null, `to` address will receive the amount
 * @returns {status, tx} status (preparing|approved|deposited|received), if status is deposited, you could run the `recover_cctp` function to continue the process. 
 */
async function cctp($network_config, $network_type, $from_network, $to_network, $from_pk, $to_pk, $amount, $recipient = null) {
    let status = ''
    let tx = ''
    try {
        status = 'preparing'
        // console.log(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MessageSent(bytes)')))
        const providerFrom = new ethers.providers.StaticJsonRpcProvider($network_config[$network_type][$from_network].rpc)
        const providerTo = new ethers.providers.StaticJsonRpcProvider($network_config[$network_type][$to_network].rpc)

        const walletFrom = new ethers.Wallet($from_pk, providerFrom)
        const walletTo = new ethers.Wallet($to_pk, providerTo)

        // Contract Addresses
        const FROM_MESSENGER_CONTRACT_ADDRESS = $network_config[$network_type][$from_network].tokenMessenger;
        const USDC_CONTRACT_ADDRESS = $network_config[$network_type][$from_network].usdcAddress;
        const TO_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS = $network_config[$network_type][$to_network].messageTransmitter;

        // initialize contracts using address and ABI
        const fromTokenMessengerContract = new ethers.Contract(FROM_MESSENGER_CONTRACT_ADDRESS, tokenMessengerAbi, walletFrom);
        const usdcEthContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, usdcAbi, walletFrom);
        const toMessageTransmitterContract = new ethers.Contract(TO_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS, messageTransmitterAbi, walletTo);

        // To destination address
        const mintRecipient = $recipient ? $recipient : walletTo.address;
        const destinationAddressInBytes32 = ethers.utils.hexZeroPad(mintRecipient, 32)

        // STEP 1: Approve messenger contract to withdraw from our active eth address
        let balanceOf = await usdcEthContract.balanceOf(walletFrom.address)
        if(balanceOf.lt($amount)) {
            throw `${walletFrom.address} 's current balance is ${balanceOf}, lower than require amount ${$amount}`
        }
        let allowance = await usdcEthContract.allowance(walletFrom.address, FROM_MESSENGER_CONTRACT_ADDRESS)
        if(allowance.lt($amount)) {
            const approveTx = await usdcEthContract.approve(FROM_MESSENGER_CONTRACT_ADDRESS, ethers.constants.MaxUint256)
            const approveTxHash = await waitForTransaction(approveTx);
            console.log('approveTxHash: ', approveTxHash)
            tx = approveTxHash
        }
        status = 'approved'
        // STEP 2: Burn USDC
        const burnTx = await fromTokenMessengerContract.depositForBurn($amount, $network_config[$network_type][$to_network].domain, destinationAddressInBytes32, USDC_CONTRACT_ADDRESS)
        const burnTxHash = await waitForTransaction(burnTx);
        console.log('BurnTxHash: ', burnTxHash)
        status = `deposited`
        tx = burnTxHash
        // STEP 3: Retrieve message bytes from logs
        const transactionReceipt = await providerFrom.getTransactionReceipt(burnTxHash);
        const eventTopic = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MessageSent(bytes)'))
        const log = transactionReceipt.logs.find((l) => {
            return l.topics[0] === eventTopic
        })
        const messageBytes = ethers.utils.defaultAbiCoder.decode(['bytes'], log.data)[0]
        const messageHash = ethers.utils.keccak256(messageBytes);

        console.log(`MessageHash: ${messageHash}`)

        // STEP 4: Fetch attestation signature
        let attestationResponse = { status: 'pending' };
        while (attestationResponse.status != 'complete') {
            try {
                const response = await axios(`${$network_config[$network_type].AttestationServiceApi}/attestations/${messageHash}`);
                attestationResponse = response.data
                console.log(`Attestating: `, response.data)
                await new Promise(r => setTimeout(r, 2000));
            } catch (e) {
                console.log(`Attestations Error: ${e}`)
            }
        }

        const attestationSignature = attestationResponse.attestation;
        console.log(`Signature: ${attestationSignature}`)

        // STEP 5: Using the message bytes and signature recieve the funds on destination chain and address
        const receiveTx = await toMessageTransmitterContract.receiveMessage(messageBytes, attestationSignature)
        const receiveTxHash = await waitForTransaction(receiveTx);
        console.log('receiveTxHash: ', receiveTxHash)
        tx = receiveTxHash
        status = 'received'
        return {
           status,
           tx
        }
    } catch (e) {
        return {
            status,
            message: `${e}`,
            tx
        }
    }

}

/**
 * @param {object} $network_config
 * @param {string} $network_type MainNet | TestNet
 * @param {string} $from_network Ethereum | Avalanche | Arbitrum
 * @param {string} $to_network Ethereum | Avalanche | Arbitrum
 * @param {string} $to_pk Private key of the wallet which to transfer token to recipient
 * @param {string} $tx depositForBurn Tx Hash
 * @returns {status, tx} status (preparing|received)
 */
async function recover_cctp($network_config, $network_type, $from_network, $to_network, $to_pk, $tx) {
    let status = ''
    let tx = ''
    try {
        status = 'preparing'
        const providerFrom = new ethers.providers.StaticJsonRpcProvider($network_config[$network_type][$from_network].rpc)
        const providerTo = new ethers.providers.StaticJsonRpcProvider($network_config[$network_type][$to_network].rpc)
        const walletTo = new ethers.Wallet($to_pk, providerTo)

        // Contract Addresses
        const TO_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS = $network_config[$network_type][$to_network].messageTransmitter;
        const toMessageTransmitterContract = new ethers.Contract(TO_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS, messageTransmitterAbi, walletTo);

        // STEP 3: Retrieve message bytes from logs
        const transactionReceipt = await providerFrom.getTransactionReceipt($tx);
        const eventTopic = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MessageSent(bytes)'))
        const log = transactionReceipt.logs.find((l) => {
            return l.topics[0] === eventTopic
        })
        const messageBytes = ethers.utils.defaultAbiCoder.decode(['bytes'], log.data)[0]
        const messageHash = ethers.utils.keccak256(messageBytes);

        console.log(`MessageHash: ${messageHash}`)

        // STEP 4: Fetch attestation signature
        let attestationResponse = { status: 'pending' };
        while (attestationResponse.status != 'complete') {
            try {
                const response = await axios(`${$network_config[$network_type].AttestationServiceApi}/attestations/${messageHash}`);
                attestationResponse = response.data
                console.log(`Attestating: `, response.data)
                await new Promise(r => setTimeout(r, 2000));
            } catch (e) {
                console.log(`Attestations Error: ${e}`)
            }
        }

        const attestationSignature = attestationResponse.attestation;
        console.log(`Signature: ${attestationSignature}`)

        // STEP 5: Using the message bytes and signature recieve the funds on destination chain and address
        const receiveTx = await toMessageTransmitterContract.receiveMessage(messageBytes, attestationSignature)
        const receiveTxHash = await waitForTransaction(receiveTx);
        console.log('receiveTxHash: ', receiveTxHash)
        tx = receiveTxHash
        status = 'received'
        return {
           status,
           tx
        }
    } catch (e) {
        return {
            status,
            tx,
            message: `${e}`,
        }
    }

}

const waitForTransaction = async (res) => {
    let receipt = await res.wait()
    return receipt.transactionHash
}

module.exports = {
    $network_config, cctp, recover_cctp
}
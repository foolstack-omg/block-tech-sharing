
const { log, noticeAlertDing, noticeCommonDing } = require("../../utils/common.js")
const { join } = require('path')
require('dotenv').config({ path: join(__dirname, '../..', '.env') });
const { createClient } = require('redis') ;
const { default: axios } = require('axios');
const { generatePrivateKey, getPublicKey, validateEvent, verifySignature, getEventHash, nip19, nip04, relayInit, finishEvent } = require('nostr-tools')
require('websocket-polyfill')
const { MD5 } = require("crypto-js");
const { bech32 } = require('bech32')
const { ethers } = require("ethers");
const NOSTR_TOKEN_SEND_TO = "npub1dy7n73dcrs0n24ec87u4tuagevkpjnzyl7aput69vmn8saemgnuq0a4n6y"
const NOSTR_MARKET_SEND_TO = "npub1zl7exeul3py65wt9ux243r0e3pukt8jza28xmpu844mj5wqpncaq0s2tyw"

const NOSTR_MATKET_API = 'https://market-api.nostrassets.com'

const relay = relayInit('wss://relay.nostrassets.com')

const decodeSendTo = `${nip19.decode(NOSTR_MARKET_SEND_TO).data}`
const ROBOT_PRIVATE_KEY = generatePrivateKey()
const robotPubkey = getPublicKey(ROBOT_PRIVATE_KEY);
let privateKey = "nsec1rjcddljhjw2wsdusuhrydhjqf3j9sj4xraqas4w8x54t2wpsa4hqmtx73v" // NOSTR私钥
privateKey = nip19.decode(privateKey).data
const publicKey = getPublicKey(privateKey)

var import_utils = require("@noble/hashes/utils");
var import_secp256k1 = require("@noble/curves/secp256k1");
var import_base = require("@scure/base");
var utf8Encoder = new TextEncoder();
var crypto = require('crypto')
const { randomBytes } = require('@noble/hashes/utils') ;
const { bytesToNumberBE, concatBytes, ensureBytes, numberToBytesBE} = require('./tools/curves-utils.js') ;
const { Field, mod, pow2 } = require('./tools/curves-modular.js') ;
const { sha256 } = require('@noble/hashes/sha256');
const import_utils2 = require("@noble/hashes/utils");
const modP = (x) => mod(x, secp256k1P);
const modN = (x) => mod(x, secp256k1N);
const TAGGED_HASH_PREFIXES = {};


const numTo32b = (n) => numberToBytesBE(n, 32);
const _0n = BigInt(0);
const secp256k1P = BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f');
const secp256k1N = BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141');
const Point = import_secp256k1.secp256k1.ProjectivePoint;
const pointToBytes = (point) => point.toRawBytes(true).slice(1);
let iv, ivb64, cryptoKey;
const { bytes: px, scalar: d } = schnorrGetExtPubKey(privateKey); // checks for isWithinCurveOrder
const auxRand = randomBytes(32)
const a = ensureBytes('auxRand', auxRand, 32); // Auxiliary random data a: a 32-byte array
const t = numTo32b(d ^ bytesToNumberBE(taggedHash('BIP0340/aux', a))); // Let t be the byte-wise xor of bytes(d) and hash/aux(a)


async function main() {
    /** encrypt */
    const key = import_secp256k1.secp256k1.getSharedSecret(privateKey, "02" + decodeSendTo);
     
    const normalizedKey = getNormalizedX(key);
    
    iv = Uint8Array.from((0, import_utils.randomBytes)(16));
    cryptoKey = await crypto.subtle.importKey("raw", normalizedKey, { name: "AES-CBC" }, false, ["encrypt"]);
    
    ivb64 = import_base.base64.encode(new Uint8Array(iv.buffer));


    // await relay.connect()
    // relay.on('connect', () => {
    //     log(`connected to ${relay.url}`)
    // })
    // let stopConnect = false;
    // relay.on('error', async () => {
    //     log(`failed to connect to ${relay.url}`)
    //     stopConnect = true
    //     await sleep(60 * 1000)
    //     stopConnect = false
    // })
    // setInterval(async () => {
    //     try {
    //         if(stopConnect) {
    //             log(`stopping connect.`)
    //             return
    //         }
    //         if(relay.status != 1) {
    //             await relay.connect()
    //         }
    //     } catch(e) {
    //         if(stopConnect == false) {
    //             log(`connetc relay error ${e}`)
    //         }
    //     }
    // }, 50)

    const client = createClient({
        socket: {
          port: 6379,
          host: process.env.REDIS_HOST,
        }
    });
    client.on('error', (err) => console.log('Redis Client Error', err));
    await client.connect()
    log('redis connected.')

    let notified_data = {}
    
    await client.del('NOSTR_ORDER_DATA')
    while (true) {
        
        try {
            let data = await client.BLPOP(['NOSTR_ORDER_DATA'], 0)
            let value = data.element
            log(`data`, value)
            if(!notified_data[MD5(value)]) {
                log(`noticfing: ${value}`)
                noticeCommonDing(`${value}`)
                notified_data[MD5(value)] =  1
            } else {
                notified_data[MD5(value)] = true
            }
            
        } catch (e) {
            log(`${e}`)
        }
    }

}

main()

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}



async function execQueryNostr(queryCommand) {
    let result = null;
    const kind = 4;
    const tags = [
        ["p", decodeSendTo],
        ["r", "json"],
        ["a", robotPubkey]
    ];
    let receiver = robotPubkey;
   
    let ciphertext = await encrypt(queryCommand);
    let created_at = Math.floor(Date.now() / 1000)
    let event = {
        kind: kind,
        created_at: created_at,
        tags: tags,
        content: ciphertext,
        pubkey: publicKey
    }
    event.id = getEventHash(event)

    // this assigns the pubkey, calculates the event id and signs the event in a single step
    // const willSendEvent = finishEvent(event, privateKey)
    event.sig = getSignature(event.id)
    const willSendEvent = event
    const sendEvent = { ...willSendEvent, message: queryCommand };
    // log(`willSendEvent id: ${willSendEvent.id}`)
    const filter = {
        // ids: [willSendEvent.id]
        kinds: [kind],
        since: Math.floor(Date.now() / 1000),
        "#e": [willSendEvent.id],
        "#p": [receiver]
    };

   
    await relay.publish(willSendEvent)
    let retEvent = await relay.get(filter)

    if (!retEvent) {
        const errRet = {
            retEvent: null,
            sendEvent: sendEvent,
            result: { code: 400, data: "Timeout", msg: "Timeout" }
        };
        log(`❌ ${queryCommand}`, errRet);
        return errRet;
    }

    const content = retEvent.content;
    const decryptContent = await nip04.decrypt(ROBOT_PRIVATE_KEY, decodeSendTo, content);
    if (decryptContent) {
        try {
            result = JSON.parse(decryptContent);
        } catch (error) {
            const errRet = {
                retEvent: null,
                sendEvent: sendEvent,
                result: { code: 500, data: decryptContent, msg: decryptContent }
            };
            log(`❌ ${queryCommand}`, errRet);
            return errRet;
        }

        const sucRet = {
            sendEvent: sendEvent,
            retEvent: retEvent,
            result
        };
        if (result.code === 0) {
            log(`✅ ${queryCommand}`, sucRet);
        } else {
            log(`❗️${queryCommand}`, sucRet);
        }

        return sucRet;
    }

}



async function encrypt(text) {
    let plaintext = utf8Encoder.encode(text);
    let ciphertext = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, cryptoKey, plaintext);
    let ctb64 = import_base.base64.encode(new Uint8Array(ciphertext));
    return `${ctb64}?iv=${ivb64}`;
}


function challenge(...args){
    return modN(bytesToNumberBE(taggedHash('BIP0340/challenge', ...args)));
}
function schnorrSign(
    message
  ) {
    const m = ensureBytes('message', message);
    const rand = taggedHash('BIP0340/nonce', t, px, m); // Let rand = hash/nonce(t || bytes(P) || m)
    const k_ = modN(bytesToNumberBE(rand)); // Let k' = int(rand) mod n
    if (k_ === _0n) throw new Error('sign failed: k is zero'); // Fail if k' = 0.
    const { bytes: rx, scalar: k } = schnorrGetExtPubKey(k_); // Let R = k'⋅G.
    const e = challenge(rx, px, m); // Let e = int(hash/challenge(bytes(R) || bytes(P) || m)) mod n.
    const sig = new Uint8Array(64); // Let sig = bytes(R) || bytes((k + ed) mod n).
    sig.set(rx, 0);
    sig.set(numTo32b(modN(k + e * d)), 32);
    // // If Verify(bytes(P), m, sig) (see below) returns failure, abort
    // if (!schnorrVerify(sig, m, px)) throw new Error('sign: Invalid signature produced');
    return sig;
  }
function getNormalizedX(key) {
    return key.slice(1, 33);
}

function schnorrGetExtPubKey(priv) {
    let d_ = import_secp256k1.secp256k1.utils.normPrivateKeyToScalar(priv); // same method executed in fromPrivateKey
    let p = Point.fromPrivateKey(d_); // P = d'⋅G; 0 < d' < n check is done inside
    const scalar = p.hasEvenY() ? d_ : modN(-d_);
    return { scalar: scalar, bytes: pointToBytes(p) };
  }

function taggedHash(tag, ...messages) {
  let tagP = TAGGED_HASH_PREFIXES[tag];
  if (tagP === undefined) {
    const tagH = sha256(Uint8Array.from(tag, (c) => c.charCodeAt(0)));
    tagP = concatBytes(tagH, tagH);
    TAGGED_HASH_PREFIXES[tag] = tagP;
  }
  return sha256(concatBytes(tagP, ...messages));
}
function getSignature(event_hash) {
    return (0, import_utils2.bytesToHex)(schnorrSign(event_hash));
  }
  

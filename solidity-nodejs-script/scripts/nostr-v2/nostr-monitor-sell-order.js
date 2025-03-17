
const { log, noticeAlertDing } = require("../../utils/common.js")
const { join } = require('path')
require('dotenv').config({ path: join(__dirname, '../..', '.env') });
const { createClient } = require('redis');
const { default: axios } = require('axios');
const { generatePrivateKey, getPublicKey, validateEvent, verifySignature, getEventHash, nip19, nip04, relayInit, finishEvent } = require('nostr-tools')
require('websocket-polyfill')
const { MD5 } = require("crypto-js");
const { bech32 } = require('bech32')
const { ethers } = require("ethers")
const NOSTR_TOKEN_SEND_TO = "npub1dy7n73dcrs0n24ec87u4tuagevkpjnzyl7aput69vmn8saemgnuq0a4n6y"
const NOSTR_MARKET_SEND_TO = "npub1zl7exeul3py65wt9ux243r0e3pukt8jza28xmpu844mj5wqpncaq0s2tyw"

const NOSTR_MATKET_API = 'https://market-api.nostrassets.com'

const relay = relayInit('wss://relay.nostrassets.com', {
    countTimeout: 3000,
    listTimeout: 3000
})

const decodeSendTo = `${nip19.decode(NOSTR_MARKET_SEND_TO).data}`
const ROBOT_PRIVATE_KEY = generatePrivateKey()
const robotPubkey = getPublicKey(ROBOT_PRIVATE_KEY);

var import_utils = require("@noble/hashes/utils");
var import_secp256k1 = require("@noble/curves/secp256k1");
var import_base = require("@scure/base");
var utf8Encoder = new TextEncoder();
var crypto = require('crypto')
const { randomBytes } = require('@noble/hashes/utils');
const { bytesToNumberBE, concatBytes, ensureBytes, numberToBytesBE } = require('./tools/curves-utils.js');
const { Field, mod, pow2 } = require('./tools/curves-modular.js');
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

let handleType = {
    'TRICK': {
        pks: [
            'nsec1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        ],
        nextPk: ''
    },
    'NOSTR': {
        pks: [
            'nsec1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        ],
        nextPk: ''
    },
    'TREAT': {
        pks: [
            'nsec1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        ],
        nextPk: ''
    },
    'TNA': {
        pks: [
            'nsec1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
        ],
        nextPk: ''
    }
}

// pre generate: px, d, t, iv, ivb64, cryptoKey
let pks = {
    "nsec1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx": {},
    "nsec1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx": {},
    "nsec1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx": {},
    "nsec1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx": {}
}

async function initPks(pks) {
    for (let k in pks) {
        let data = {}
        data.md5 = MD5(k)
        data.publicKey = getPublicKey(nip19.decode(k).data)
        let privateKey = nip19.decode(k).data
        let { bytes: px, scalar: d } = schnorrGetExtPubKey(privateKey); // checks for isWithinCurveOrder
        data.px = px
        data.d = d
        let auxRand = randomBytes(32)
        let a = ensureBytes('auxRand', auxRand, 32); // Auxiliary random data a: a 32-byte array
        let t = numTo32b(d ^ bytesToNumberBE(taggedHash('BIP0340/aux', a))); // Let t be the byte-wise xor of bytes(d) and hash/aux(a)
        data.t = t

        let key = import_secp256k1.secp256k1.getSharedSecret(privateKey, "02" + decodeSendTo);
        let normalizedKey = getNormalizedX(key);
        let iv, ivb64, cryptoKey;
        iv = Uint8Array.from((0, import_utils.randomBytes)(16));
        cryptoKey = await crypto.subtle.importKey("raw", normalizedKey, { name: "AES-CBC" }, false, ["encrypt"]);
        ivb64 = import_base.base64.encode(new Uint8Array(iv.buffer));
        data.iv = iv
        data.cryptoKey = cryptoKey
        data.ivb64 = ivb64
        data.used_at = new Date().valueOf()
        pks[k] = data
    }
}

function setNextPk(type) {
    let typeInfo = handleType[type]
    let nextPk = null
    for (let pk of typeInfo.pks) {
        if (!nextPk) {
            nextPk = pk
        } else {
            if (pks[pk].used_at < pks[nextPk].used_at) {
                nextPk = pk
            }
        }
    }
    handleType[type].nextPk = nextPk
    log(`[${type}] next pk: ${nextPk}`)
}

let TREAT_ORACLE_SELL_PRICE = 0
let TREAT_ORACLE_BUY_PRICE = 0
let TRICK_ORACLE_SELL_PRICE = 0
let TRICK_ORACLE_BUY_PRICE = 0
let NOSTR_ORACLE_SELL_PRICE = 0
let NOSTR_ORACLE_BUY_PRICE = 0
let TNA_ORACLE_SELL_PRICE = 0
let TNA_ORACLE_BUY_PRICE = 0

async function main() {
    await initPks(pks)
    for (let type in handleType) {
        setNextPk(type)
    }

    await relay.connect()
    relay.on('connect', () => {
        log(`connected to ${relay.url}`)
    })
    let stopConnect = false;
    relay.on('error', async () => {
        log(`failed to connect to ${relay.url}`)
        stopConnect = true
        await sleep(60 * 1000)
        stopConnect = false
    })
    setInterval(async () => {
        try {
            if (stopConnect) {
                log(`stopping connect.`)
                return
            }
            if (relay.status != 1) {
                await relay.connect()
            }
        } catch (e) {
            if (stopConnect == false) {
                log(`connetc relay error ${e}`)
            }
        }
    }, 50)

    const client = createClient({
        socket: {
            port: 6379,
            host: process.env.REDIS_HOST,
        }
    });
    client.on('error', (err) => console.log('Redis Client Error', err));
    await client.connect()
    log('redis connected.')

    let cur = new Date().valueOf()
    let no = process.env.NODE_NUM ? process.env.NODE_NUM : Math.floor(Math.random() * 10)
    log(no)

    let stop = false
    let taked_order_id = {}
    while (true) {
        try {
            cur = new Date().valueOf()
            let milisec = cur % 2000
            let run = false
            if (no >= 1) {
                if (milisec >= (no - 1) * 400 && milisec < no * 400) {
                    run = true
                }
            }
            let data;


            if (run) {
                let start_at = new Date().valueOf()
                log(`start_at`, start_at)
                await axios.post(`${NOSTR_MATKET_API}/market/api/orderHistoryV1`, {
                    status: 'INIT_PENDING,INIT',
                    token: '',
                    type: 'sell',
                    page: 1,
                    count: 10,
                    eventId: "",
                    address: "",
                }).then(async res => {
                    if (res.status == 200 && res.data.code == 0) {
                        // let now = new Date().valueOf()
                        for (let i = 0; i < res.data.data['orderPOS'].length; i++) {
                            if (['INIT_PENDING','INIT'].includes(res.data.data['orderPOS'][i].status)) {
                                if (200 > (start_at - parseInt(res.data.data['orderPOS'][i].id)) || (start_at - parseInt(res.data.data['orderPOS'][i].id)) > 1200) {
                                    continue
                                }
                                switch (res.data.data['orderPOS'][i].token) {
                                    case 'TREAT': {
                                        let TREAT_MIN_SELL_PRICE = res.data.data['orderPOS'][i].price
                                        if (!(TREAT_ORACLE_SELL_PRICE > 0) || !(TREAT_ORACLE_BUY_PRICE > 0)) break
                                        if (TREAT_ORACLE_BUY_PRICE > TREAT_MIN_SELL_PRICE && TREAT_ORACLE_SELL_PRICE / TREAT_MIN_SELL_PRICE * 100 - 100 > 10 && TREAT_ORACLE_BUY_PRICE / TREAT_MIN_SELL_PRICE * 100 - 100 > 5) {
                                            let order_id = res.data.data['orderPOS'][i].id
                                            if (taked_order_id[order_id]) break
                                          
                                            let resQuery;
                                            try {
                                                resQuery = await execQueryNostr(`take order ${order_id}`, handleType['TREAT'].nextPk)
                                                // taked_order_id[order_id] = true
                                            } catch (e) {
                                                client.rPush('NOSTR_ORDER_DATA', `[财富密码][V2][${res.data.data['orderPOS'][i].token}]  take order ${order_id}: 失败. ${e}`).then(() => { })
                                            }
                                           
                                            if (resQuery.result.code == 0) {
                                                client.rPush('NOSTR_ORDER_DATA', `[财富密码][V2] take order ${order_id}: 成功. 发现时间: ${start_at}. 订单状态: ${res.data.data['orderPOS'][i].status}. ${resQuery.result.data}`).then(() => { })
                                            } else {
                                                client.rPush('NOSTR_ORDER_DATA', `[财富密码][V2][${res.data.data['orderPOS'][i].token}]  take order ${order_id}: 失败. 订单状态: ${res.data.data['orderPOS'][i].status}. ${resQuery.result.data}`).then(() => { })
                                            }
                                        }
                                        break
                                    }
                                    case 'TRICK': {
                                        let TRICK_MIN_SELL_PRICE = res.data.data['orderPOS'][i].price
                                        if (!(TRICK_ORACLE_SELL_PRICE > 0) || !(TRICK_ORACLE_BUY_PRICE > 0)) break

                                        if (TRICK_ORACLE_BUY_PRICE > TRICK_MIN_SELL_PRICE && TRICK_ORACLE_SELL_PRICE / TRICK_MIN_SELL_PRICE * 100 - 100 > 10 && TRICK_ORACLE_BUY_PRICE / TRICK_MIN_SELL_PRICE * 100 - 100 > 5) {
                                            let order_id = res.data.data['orderPOS'][i].id
                                            if (taked_order_id[order_id]) break
                                         
                                            let resQuery;
                                            try {
                                                resQuery = await execQueryNostr(`take order ${order_id}`, handleType['TRICK'].nextPk)
                                                // taked_order_id[order_id] = true
                                            } catch (e) {
                                                client.rPush('NOSTR_ORDER_DATA', `[财富密码][V2][${res.data.data['orderPOS'][i].token}]  take order ${order_id}: 失败. ${e}`).then(() => { })
                                            }
                                           
                                            if (resQuery.result.code == 0) {
                                                client.rPush('NOSTR_ORDER_DATA', `[财富密码][V2] take order ${order_id}: 成功. 发现时间: ${start_at}. 订单状态: ${res.data.data['orderPOS'][i].status}. ${resQuery.result.data}`).then(() => { })
                                            } else {
                                                client.rPush('NOSTR_ORDER_DATA', `[财富密码][V2][${res.data.data['orderPOS'][i].token}]  take order ${order_id}: 失败. 订单状态: ${res.data.data['orderPOS'][i].status}. ${resQuery.result.data}`).then(() => { })
                                            }
                                        }
                                        break
                                    }
                                    case 'NOSTR': {
                                        let NOSTR_MIN_SELL_PRICE = res.data.data['orderPOS'][i].price
                                        if (!(NOSTR_ORACLE_SELL_PRICE > 0) || !(NOSTR_ORACLE_BUY_PRICE > 0)) break
                                        if (NOSTR_ORACLE_BUY_PRICE > NOSTR_MIN_SELL_PRICE && NOSTR_ORACLE_SELL_PRICE / NOSTR_MIN_SELL_PRICE * 100 - 100 > 10 && NOSTR_ORACLE_BUY_PRICE / NOSTR_MIN_SELL_PRICE * 100 - 100 > 5) {
                                            let order_id = res.data.data['orderPOS'][i].id
                                            if (taked_order_id[order_id]) break
                                           
                                            let resQuery;
                                            try {
                                                resQuery = await execQueryNostr(`take order ${order_id}`, handleType['NOSTR'].nextPk)
                                                // taked_order_id[order_id] = true
                                            } catch (e) {
                                                client.rPush('NOSTR_ORDER_DATA', `[财富密码][V2][${res.data.data['orderPOS'][i].token}]  take order ${order_id}: 失败. ${e}`).then(() => { })
                                            }
                                            
                                            if (resQuery.result.code == 0) {
                                                client.rPush('NOSTR_ORDER_DATA', `[财富密码][V2] take order ${order_id}: 成功. 发现时间: ${start_at}. 订单状态: ${res.data.data['orderPOS'][i].status}. ${resQuery.result.data}`).then(() => { })
                                            } else {
                                                client.rPush('NOSTR_ORDER_DATA', `[财富密码][V2][${res.data.data['orderPOS'][i].token}]  take order ${order_id}: 失败. 订单状态: ${res.data.data['orderPOS'][i].status}. ${resQuery.result.data}`).then(() => { })
                                            }

                                        }
                                        break
                                    }
                                    case 'TNA': {
                                        let TNA_MIN_SELL_PRICE = res.data.data['orderPOS'][i].price
                                        if (!(TNA_ORACLE_SELL_PRICE > 0) || !(TNA_ORACLE_BUY_PRICE > 0)) break

                                        if (TNA_ORACLE_BUY_PRICE > TNA_MIN_SELL_PRICE && TNA_ORACLE_SELL_PRICE / TNA_MIN_SELL_PRICE * 100 - 100 > 10 && TNA_ORACLE_BUY_PRICE / TNA_MIN_SELL_PRICE * 100 - 100 > 5) {
                                            let order_id = res.data.data['orderPOS'][i].id
                                            if (taked_order_id[order_id]) break
                                            let resQuery;
                                            try {
                                                resQuery = await execQueryNostr(`take order ${order_id}`, handleType['TNA'].nextPk)
                                                // taked_order_id[order_id] = true
                                            } catch (e) {
                                                client.rPush('NOSTR_ORDER_DATA', `[财富密码][V2][${res.data.data['orderPOS'][i].token}]  take order ${order_id}: 失败. ${e}`).then(() => { })
                                            }
                                            
                                            if (resQuery.result.code == 0) {
                                                client.rPush('NOSTR_ORDER_DATA', `[财富密码][V2] take order ${order_id}: 成功. 发现时间: ${start_at}. 订单状态: ${res.data.data['orderPOS'][i].status}. ${resQuery.result.data}`).then(() => { })
                                            } else {
                                                client.rPush('NOSTR_ORDER_DATA', `[财富密码][V2][${res.data.data['orderPOS'][i].token}]  take order ${order_id}: 失败. 订单状态: ${res.data.data['orderPOS'][i].status}. ${resQuery.result.data}`).then(() => { })
                                            }
                                        }
                                        break
                                    }
                                }
                            }
                        }

                    } else {
                        log(`failed`, res.data)
                        await sleep(3 * 1000)
                    }
                }).catch(e => {
                    log(`${e}`)
                    stop = true
                })
                if (stop) {
                    log(`stop.`)
                    await sleep(3 * 1000)
                    stop = false
                }

                let end_at = new Date().valueOf()
                log(`end_at`, end_at)
                if (end_at - start_at < 3000) {
                    let ORACLE_PRICE_UPDATED_AT = await client.get('ORACLE_PRICE_UPDATED_AT')
                    while (ORACLE_PRICE_UPDATED_AT < new Date().valueOf() - 3 * 60 * 1000) {
                        noticeAlertDing(`[财富密码] NOSTR价格预言机价格未更新`)
                        await sleep(10000)
                        ORACLE_PRICE_UPDATED_AT = await client.get('ORACLE_PRICE_UPDATED_AT')
                    }
                    data = await client.get('TREAT_ORACLE_SELL_PRICE')
                    if (data > 0) {
                        TREAT_ORACLE_SELL_PRICE = data
                    }
                    data = await client.get('TREAT_ORACLE_BUY_PRICE')
                    if (data > 0) {
                        TREAT_ORACLE_BUY_PRICE = data
                    }
                    data = await client.get('TRICK_ORACLE_SELL_PRICE')
                    if (data > 0) {
                        TRICK_ORACLE_SELL_PRICE = data
                    }
                    data = await client.get('TRICK_ORACLE_BUY_PRICE')
                    if (data > 0) {
                        TRICK_ORACLE_BUY_PRICE = data
                    }
                    data = await client.get('NOSTR_ORACLE_SELL_PRICE')
                    if (data > 0) {
                        NOSTR_ORACLE_SELL_PRICE = data
                    }
                    data = await client.get('NOSTR_ORACLE_BUY_PRICE')
                    if (data > 0) {
                        NOSTR_ORACLE_BUY_PRICE = data
                    }
                    data = await client.get('TNA_ORACLE_SELL_PRICE')
                    if (data > 0) {
                        TNA_ORACLE_SELL_PRICE = data
                    }
                    data = await client.get('TNA_ORACLE_BUY_PRICE')
                    if (data > 0) {
                        TNA_ORACLE_BUY_PRICE = data
                    }
                    end_at = new Date().valueOf()
                    log(`oracle end_at`, end_at)
                    if (end_at - start_at < 1000) {
                        await sleep(1000 - (end_at - start_at))
                    }
                }
            } else {

                await sleep(10)
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


async function execQueryNostr(queryCommand, pk) {
    await relay.connect()
    let result = null;
    const kind = 4;
    const tags = [
        ["p", decodeSendTo],
        ["r", "json"],
        ["a", robotPubkey]
    ];
    let receiver = robotPubkey;

    let ciphertext = await encrypt(queryCommand, pk);
    let created_at = Math.floor(Date.now() / 1000) + 3
    let event = {
        kind: kind,
        created_at: created_at,
        tags: tags,
        content: ciphertext,
        pubkey: pks[pk].publicKey
    }
    event.id = getEventHash(event)

    // this assigns the pubkey, calculates the event id and signs the event in a single step
    event.sig = getSignature(event.id, pk)
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



async function encrypt(text, pk) {
    let plaintext = utf8Encoder.encode(text);
    let ciphertext = await crypto.subtle.encrypt({ name: "AES-CBC", iv: pks[pk].iv }, pks[pk].cryptoKey, plaintext);
    let ctb64 = import_base.base64.encode(new Uint8Array(ciphertext));
    return `${ctb64}?iv=${pks[pk].ivb64}`;
}


function challenge(...args) {
    return modN(bytesToNumberBE(taggedHash('BIP0340/challenge', ...args)));
}
function schnorrSign(
    message, pk
) {
    const m = ensureBytes('message', message);
    const rand = taggedHash('BIP0340/nonce', pks[pk].t, pks[pk].px, m); // Let rand = hash/nonce(t || bytes(P) || m)
    const k_ = modN(bytesToNumberBE(rand)); // Let k' = int(rand) mod n
    if (k_ === _0n) throw new Error('sign failed: k is zero'); // Fail if k' = 0.
    const { bytes: rx, scalar: k } = schnorrGetExtPubKey(k_); // Let R = k'⋅G.
    const e = challenge(rx, pks[pk].px, m); // Let e = int(hash/challenge(bytes(R) || bytes(P) || m)) mod n.
    const sig = new Uint8Array(64); // Let sig = bytes(R) || bytes((k + ed) mod n).
    sig.set(rx, 0);
    sig.set(numTo32b(modN(k + e * pks[pk].d)), 32);
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
function getSignature(event_hash, pk) {
    return (0, import_utils2.bytesToHex)(schnorrSign(event_hash, pk));
}

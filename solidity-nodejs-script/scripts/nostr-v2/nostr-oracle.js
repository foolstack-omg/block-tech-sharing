
const { log, noticeAlertDing } = require("../../utils/common.js")
const { join } = require('path')
const { createClient } = require('redis');
require('dotenv').config({ path: join(__dirname, '../..', '.env') });
const { default: axios } = require('axios');
const { generatePrivateKey, getPublicKey, validateEvent, verifySignature, getSignature, getEventHash, nip19, nip04, relayInit, finishEvent } = require('nostr-tools')
require('websocket-polyfill')
let privateKey = process.env.NOSTR_PRIVATE_KEY
privateKey = nip19.decode(privateKey).data

const NOSTR_MATKET_API = 'https://market-api.nostrassets.com'
async function main() {

    const client = createClient({
        socket: {
            port: 6379,
            host: process.env.REDIS_HOST,
        }
    });
    client.on('error', (err) => console.log('Redis Client Error', err));
    await client.connect()
    log('redis connected.')

    while (true) {
        try {
            // 设置预言机价格查询
            let res;
            res = await axios.post(`${NOSTR_MATKET_API}/market/api/orderListing`, {
                token: 'TRICK',
                type: 'BUY',
                page: 1,
                count: 5,
            })
            if (res.status == 200 && res.data.code == 0) {
                let quantity = 0
                let amount = 0
                // log(`1`,res.data.data['orderPOS'])
                for (let i = 1; i < res.data.data['orderPOS'].length; i++) {

                    quantity += res.data.data['orderPOS'][i].volume
                    amount += res.data.data['orderPOS'][i].volume * res.data.data['orderPOS'][i].price
                }
                let TRICK_ORACLE_BUY_PRICE = Math.floor(amount / quantity)
                log(`TRICK_ORACLE_BUY_PRICE`, TRICK_ORACLE_BUY_PRICE)
                await client.set('TRICK_ORACLE_BUY_PRICE', TRICK_ORACLE_BUY_PRICE.toString())
            }
            await sleep(2000)
            res = await axios.post(`${NOSTR_MATKET_API}/market/api/orderListing`, {
                token: 'TRICK',
                type: 'SELL',
                page: 1,
                count: 5,
            })
            if (res.status == 200 && res.data.code == 0) {
                let quantity = 0
                let amount = 0
                // log(`1`,res.data.data['orderPOS'])
                for (let i = 1; i < res.data.data['orderPOS'].length; i++) {

                    quantity += res.data.data['orderPOS'][i].volume
                    amount += res.data.data['orderPOS'][i].volume * res.data.data['orderPOS'][i].price
                }
                let TRICK_ORACLE_SELL_PRICE = Math.floor(amount / quantity)
                log(`TRICK_ORACLE_SELL_PRICE`, TRICK_ORACLE_SELL_PRICE)
                await client.set('TRICK_ORACLE_SELL_PRICE', TRICK_ORACLE_SELL_PRICE.toString())
            }
            await sleep(2000)
            res = await axios.post(`${NOSTR_MATKET_API}/market/api/orderListing`, {
                token: 'TREAT',
                type: 'BUY',
                page: 1,
                count: 5,
            })
            if (res.status == 200 && res.data.code == 0) {
                let quantity = 0
                let amount = 0
                // log(`1`,res.data.data['orderPOS'])
                for (let i = 1; i < res.data.data['orderPOS'].length; i++) {

                    quantity += res.data.data['orderPOS'][i].volume
                    amount += res.data.data['orderPOS'][i].volume * res.data.data['orderPOS'][i].price
                }
                let TREAT_ORACLE_BUY_PRICE = Math.floor(amount / quantity)
                log(`TREAT_ORACLE_BUY_PRICE`, TREAT_ORACLE_BUY_PRICE)
                await client.set('TREAT_ORACLE_BUY_PRICE', TREAT_ORACLE_BUY_PRICE.toString())
            }
            await sleep(2000)
            res = await axios.post(`${NOSTR_MATKET_API}/market/api/orderListing`, {
                token: 'TREAT',
                type: 'SELL',
                page: 1,
                count: 5,
            })

            if (res.status == 200 && res.data.code == 0) {
                let quantity = 0
                let amount = 0
                // log(`1`,res.data.data['orderPOS'])
                for (let i = 1; i < res.data.data['orderPOS'].length; i++) {

                    quantity += res.data.data['orderPOS'][i].volume
                    amount += res.data.data['orderPOS'][i].volume * res.data.data['orderPOS'][i].price
                }
                let TREAT_ORACLE_SELL_PRICE = Math.floor(amount / quantity)
                log(`TREAT_ORACLE_SELL_PRICE`, TREAT_ORACLE_SELL_PRICE)
                await client.set('TREAT_ORACLE_SELL_PRICE', TREAT_ORACLE_SELL_PRICE.toString())
            }
            await sleep(2000)
            res = await axios.post(`${NOSTR_MATKET_API}/market/api/orderListing`, {
                token: 'NOSTR',
                type: 'BUY',
                page: 1,
                count: 5,
            })
            if (res.status == 200 && res.data.code == 0) {
                let quantity = 0
                let amount = 0
                // log(`1`,res.data.data['orderPOS'])
                for (let i = 1; i < res.data.data['orderPOS'].length; i++) {
                    quantity += res.data.data['orderPOS'][i].volume
                    amount += res.data.data['orderPOS'][i].volume * res.data.data['orderPOS'][i].price
                }
                let NOSTR_ORACLE_BUY_PRICE = Math.floor(amount / quantity)
                log(`NOSTR_ORACLE_BUY_PRICE`, NOSTR_ORACLE_BUY_PRICE)
                await client.set('NOSTR_ORACLE_BUY_PRICE', NOSTR_ORACLE_BUY_PRICE.toString())
            }
            await sleep(2000)
            res = await axios.post(`${NOSTR_MATKET_API}/market/api/orderListing`, {
                token: 'NOSTR',
                type: 'SELL',
                page: 1,
                count: 5,
            })

            if (res.status == 200 && res.data.code == 0) {
                let quantity = 0
                let amount = 0
                // log(`1`,res.data.data['orderPOS'])
                for (let i = 1; i < res.data.data['orderPOS'].length; i++) {

                    quantity += res.data.data['orderPOS'][i].volume
                    amount += res.data.data['orderPOS'][i].volume * res.data.data['orderPOS'][i].price
                }
                let NOSTR_ORACLE_SELL_PRICE = Math.floor(amount / quantity)
                log(`NOSTR_ORACLE_SELL_PRICE`, NOSTR_ORACLE_SELL_PRICE)
                await client.set('NOSTR_ORACLE_SELL_PRICE', NOSTR_ORACLE_SELL_PRICE.toString())
            }
            await sleep(2000)
            await client.set('ORACLE_PRICE_UPDATED_AT', new Date().valueOf())
            await sleep(2000)
        } catch (e) {
            log(`${e}`)
            await sleep(10000)
        }


    }

}

main()

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

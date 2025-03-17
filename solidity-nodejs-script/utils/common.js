const { default: axios } = require('axios');
const { ethers } = require('ethers')

function log(message, data = null) {
    let date = new Date().toLocaleString()
    console.log(`[${date}]: ` + message, data)
}

function getDate(ts) {
    let now = new Date()
    if (ts) {
        now = new Date(ts);
    }
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
}

function noticeDing(access_token, message, atMobiles) {
    axios.post(`https://oapi.dingtalk.com/robot/send?access_token=${access_token}`, {
        msgtype: 'text',
        text: {
            content: `${message}`,
        },
        at: {
            atMobiles: atMobiles,
            isAtAll: false
        }
    }).then(res => { })
        .catch(e => log(e))
}

function noticeAlertDing(message) {
    noticeDing('17504305171ae6b3bbfxxxxxxxxxxxxa7188744de947b883ef0209', message, [13300000052])
}
function noticeCommonDing(message) {
    noticeDing('e3f1c1732eae073f3ad7xxxxxxxxxxxxxxx8bec3d983d84ab8d86f', message, [])
}
function noticeTelegram(token, chat_id, text) {
    axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chat_id,
        text: text
    }).then(res => {

    }).catch(e => {
        log(e)
    })
}

function parseSignature(signature) {
    const bytes = ethers.utils.arrayify(signature);
    if (bytes.length !== 65) {
        throw new Error('Invalid signature length');
    }
    const v = bytes[64];
    if (v !== 27 && v !== 28) {
        throw new Error('Invalid signature v value');
    }
    const r = bytes.slice(0, 32);
    const s = bytes.slice(32, 64);
    return { r, s, v };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = {
    log, getDate, noticeAlertDing, noticeCommonDing, parseSignature, noticeTelegram, sleep
}
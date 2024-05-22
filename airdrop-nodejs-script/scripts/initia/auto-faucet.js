const fs = require('fs')
const { Wallet, LCDClient, MnemonicKey } = require('@initia/initia.js') 
const Worker = require('tiny-worker');
const {solveChallenge, solveChallengeWorkers} = require('altcha-lib')
const { default: axios } = require('axios');
const { join } = require('path')
require('dotenv').config({ path: join(__dirname, '../..', '.env') });
const { log } = require('../../utils/common.js')
const ethers = require('ethers')
const fakeUa = require('fake-useragent');
const { HttpsProxyAgent } = require('https-proxy-agent');
const {wallets} = require('../../wallets/initia.js')
const IP_PROXY = process.env.IP_PROXY

const lcd = new LCDClient('https://lcd.initiation-1.initia.xyz/')

let agent = new HttpsProxyAgent('http://ipfuqv0e:DC32IceOAF0HMmQp_session-bTYSwBxz@209.38.175.3:31112');
let accounts = []
wallets.forEach(k => {
    accounts.push(k.address)
})
const MAX_RETRIES = 1; // 最大重试次数
const MAX_PROXY_CHECK_ATTEMPTS = 3;
let agents = `ipfuqv0e:DC32IceOAF0HMmQp_session-yXDUJGqo@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-445lAYfy@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-sU0xJdk7@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-gSiHV4hi@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ZFMdK47F@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-MQ08XRiq@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-IvdxSE4m@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-e08yfKQk@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-RFYoBp0S@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-gaWGqDkc@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-oHgcm4ma@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-AF5mqoB9@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-jbPt4Br0@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-rn7pAYiP@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-gND6L6fH@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-OkMfjWtx@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-CCdZ7PPq@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ybUeTUQP@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-RJxYtR2G@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-sCAZ25hY@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-VvWIAGoe@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ZY8NCacd@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-bM0ZgRSV@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-me23l56g@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Xy6YeOtc@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-4uaeVyak@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-uFEqn02o@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-I2JBcahy@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-AXnQYKKV@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-BAdbhVAF@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-oGETPRc0@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-KqUkq0sv@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-LYEoSGVm@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-zKelnDHV@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-HlzweiVy@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-GkizZouB@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-bW41Pecf@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-UuhYHebL@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-T9n4LpVP@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-8nLKfIhZ@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-rGirEnHj@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-BMLgGSns@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-rffqxVzO@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-C3e0A9TW@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ZVg2Hopi@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-6YacUPkb@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-iQBv3QTg@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-N1wQzHgQ@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-q5XugUDR@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-WLBkAeQ4@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-APobHj54@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ZQlZU1Ha@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-cdqK1MIB@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-3GP4iR3L@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-tpFRgOJi@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ajNTaggO@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-y7lJ6Mb2@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Gr8KsjIa@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Mp9gG3xh@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-0q7WPofW@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-pmtpC67d@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-DVcWczFJ@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-IiGB7mjP@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-BrTf7Zmx@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-VIK4CtJf@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-VyWsjRLM@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-eNRQ32Gu@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-sbpNrv2N@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-GceBVJoN@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-d95Zbydv@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-I0vZ83zj@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-PJlLwnj4@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-loxpy3by@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-D58lQ591@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-XNhUJIWc@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-fs0nwBC9@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-uxCWCcGH@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-I0udBasE@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-34gznIOl@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-yaYaOzpq@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-iJgWvaVF@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ByfKhvm1@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-pSruKEo0@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-6x4FlDrE@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-58QM1vlS@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Xx6rq4CG@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-d4VlVm5e@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-PxrvoZcY@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-bQgmzORp@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-hcZBec0D@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-bI7w1XtD@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-U6aSX6DT@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-m8YUGcq5@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-3ZPlXVNy@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ntIufayx@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-mHzUI5Gf@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-wFj8kJ2E@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-k4Uu1dEB@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-XC4qu8nC@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-PQRdQBl6@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-gvKCdnpP@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-fdzsH9on@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-VdHlRXW9@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-vSuedV8Y@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-jcmgPl3A@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-kXY5EpvI@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-EjrZIZPC@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-PYaTWjR4@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-gY2ScWJZ@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-yEf6vP8j@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-vLQfnniR@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-iQMjfMs7@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-xkOWkVJy@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-JKAIeMEf@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-wcEZIvU9@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-4iaSCjF3@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-iTrl5HED@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-zu3ACpp7@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Qq6p072m@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-GIRCU3Pf@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-jIfmp7cd@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-GIEub6GA@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Lsh4J82B@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-KDJgUIMj@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-4BY7A8oT@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-xrLpxuRk@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-JqCAON1E@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-PV7rLSRg@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-q4edOGHO@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-1GCgIs8u@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-jGICLuKA@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-geLr5RQV@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-RcT0159B@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-3wb79L0V@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-pPzCJFuS@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-zmBIxFUA@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-P2cbCWYv@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-xJZOJIgq@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ogDu6ojD@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-XbZtklLL@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-juYYOOGA@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-PXAZdvRH@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-xRWNLZy7@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-DM3pYo6K@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-NO3f7iOj@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-FXuhr8od@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-M2HR2E2O@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-PdTtlHnp@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-NPIizMnR@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-rZCT3HC2@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-MKfqFxHa@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-FUYWzAMc@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-GNTo2hGi@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Y9uem7fr@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-9Qwo9uFv@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-UNIyah4o@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-o1wVW3Eh@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-5FohPmqp@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-MIScM09g@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-XBLx5PmC@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-SUafIgd4@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Ap1d3ChS@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Gwfa8S02@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-QRbb0T7w@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-v1J1Qs95@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-tiXlqFAo@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-yWjoJDn5@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-cxYtkvGe@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-kq8DSUki@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-km71AfD0@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-rK9mvt2Q@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-1X8PFYmg@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-zafLeQ0H@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-YL2ikolp@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-kZ5co0BP@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ZhlOnLr5@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-PkKdygLv@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-9hqOV4QT@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-7Vi6IPyk@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-U0NlzPGb@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-74MOiyoj@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Oit058T7@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-sLE2Dz9y@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-a2fHW92C@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Rmlf1kjq@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-s3IpCESb@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-dgTPWmWq@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-fU9VZzBL@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-g5J9nUQD@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-zuy3fXek@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-H4NkEEcg@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ZTu5einZ@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-8TbjHIAx@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-8g43tyoy@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-osiK7rTO@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-sygMD7Kv@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-1zw6WtGO@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-znvi8AV9@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-L6hBxVEl@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-3r7xoDYZ@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-jpfgrOp5@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-zjw5EFHh@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-TEsMnxjF@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Z0gB36zI@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-cOBETjB9@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-QQi9dSQi@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-NXcDdUZd@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-W7WMolKz@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-1bbvMVTr@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-kgz2q7sg@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-mltfvdhh@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-PBV1fBFb@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-gSRg3paH@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ssgIYgVb@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-0wZ3JG0g@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-DHY9mrEl@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-5NA5M91s@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-5RAeItIN@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Qa6FfMNu@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-rc6z6uM8@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-3UvY3Mzt@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-LstxjfQA@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-sway29zS@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-VcIU8Yrf@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ndGgV5P7@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-KL4UHrSk@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-72t8RLhe@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-9XvgW4Rs@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-FUX1tO5s@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-A3qlZQwD@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ikilZTmJ@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-nTm6T5fY@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-inzDLqyY@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Iqm8Gewz@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-lUIo4Blz@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-mHy8OIAY@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-EhlKvaJQ@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-76QLzx2C@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-i3XRo9aY@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-OODjvLjr@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-5sKcnRGc@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-DfvjJNlb@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-qAozIPsP@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-8s8b5iQe@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-s4JU0GRK@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-J8qAcUw5@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-B2PagKSS@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-gAoIu6Ip@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-xFXjFTgK@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-V5YnVNfq@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-SumOIBbz@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-pBJNb6yE@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-v89IXktu@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-2Oh5O841@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-l8Ldd8Ub@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ZniqfkMV@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-gsVhBEj1@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-YRDTxxd7@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-H5ORXKnR@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-H2WCBJJA@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-NaWXmMQo@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-3EVQhtrl@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-zuB9M5Ca@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-FthiTxz4@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-IHifQiKY@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ps2JTIMH@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-iQYIS6hX@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-eSfaBSl9@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-64WJKMjS@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-GTn5l7Yu@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-H27ezOT2@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-6SYSJ7i5@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-4ILB8Btk@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-YvKqP8u0@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-yKF3xbhk@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-KUtjoELx@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-DTXy7XZG@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-VMzyglkL@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-6S43qB4b@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Sdbu05ab@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-cW3MXX13@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-PfCEKbuZ@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-kOT6m2Av@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Ct9Yydtc@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-h4jTuFbX@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-12dFaNPy@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-RqIYGhoN@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-vh8U8F5w@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-a94hguoM@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-IOQsozuB@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-VWmzbhQO@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-BdoeGzRh@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-llGaNQLx@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-QZa7Uvs4@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-kP7AOsXW@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-2BV7R46O@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-aKGfczv0@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-qQ1BCwVy@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-46PHa8vZ@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-v0QPVJzR@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-BGgUaOTt@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-YpfDq7Kw@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-kcfia0X5@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-kEo7pYKK@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-c2jyEjbm@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-YGf7PRPx@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-2MEmpzCM@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-38uIqgsF@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-QhrA2Ipw@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-MLBGD0UU@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-FMokStP8@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-HtFBIKDI@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-mKo4eRxR@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-iF5S87I1@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Wj3N1uiW@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-vbQqu8nE@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-BdWGOvqZ@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-PwbnTm0r@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ISx0Gu9I@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-zHqyaTKd@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-rsIZWXRq@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-2rUeRPSG@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-WIzFZBwS@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-fGySmN8Y@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-9jdYPhsW@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-kNe9I9Q7@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-vIgejJ09@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ixy60Uwt@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Pu9qniv3@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-iMVZxoIX@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-dEL3799b@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-lTk0FWsR@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-nMYIIeg9@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-LNahdKKH@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-4g8z0lzG@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-SdFaoCkv@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-HnqZyDVD@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-L2ctq3FN@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-IhgSxI1h@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-tXAJFIwG@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-XSV3Exhg@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-kZZ40MHS@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-fjhksAOx@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-jzEGt3pZ@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-vNWTMx1K@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-YF86iNdC@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-INslQzJJ@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-SB2VPlbW@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-j1TqG8b2@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Nai4ZJVg@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-tQAwVvrb@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-K7QCbCF1@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-3dHwmBI8@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-RIQpnKu0@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-RBHrVbGt@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-IRYD60SI@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-k8RkAc7Q@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-G80yUkX5@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-xHMwrxHg@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-IpjLwRfE@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-IPGj2dpn@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-yWXloiCC@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-cll1kD9n@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-3M8Gyhdq@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-TXxMNYkH@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-OwG01R9h@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-OrYuDyOt@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-GPEAtWLX@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ptKjrtjs@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-OPl2N6Xz@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-l8uaxBry@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-knAPKXlv@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-9jJvzm7H@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-O9qz76h5@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ZG6mMl0C@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-RtD8As7C@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-6OMCRGOp@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-tenV2VQl@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-tHKCRN4l@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-LRzKQYqo@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-NN5ydRgo@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-IY79f3Xc@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-sIUEf02U@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-2n82WTtL@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-SdxxvLhX@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-A3qyFIw6@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ehK4r9sv@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-9ZhGkNiJ@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-pKBMecUO@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ugaWwh23@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-m4jlgqEv@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-5yQYuyCB@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-mCSBKF40@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-gXyRKqUi@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-O6BvaZdZ@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-x28KmX4e@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-7OmrJHgu@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-rwBber3S@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-x5oshbL0@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-VeLYLBk7@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-83fiY0Ee@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Nr3G4M5z@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-cC77q2tB@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-MqBHQHhd@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ywBeVNYK@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-4mDlmjbQ@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-sPraJ9xG@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-4MW5wfrV@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-RMZryoJA@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-PUSSWbeR@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-JIRnmNVj@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-7ecZlxXP@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-d7mURCju@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-eLJQeZZB@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-7GgB0b9y@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-6edpnRPh@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-yDOyxD7y@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-BDK5q2HJ@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-nTDAmIjn@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-TtkJG67w@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-pS3aoxrd@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-CLr6TXKu@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-MFRpTUM1@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-PNThHknn@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-PvKv7i99@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-sE9tdSLM@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-SjSxNRR4@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-MWZrOEvl@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-YglWeh37@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-8aX8CnTe@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-OIghCyit@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-yYSBlIEI@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-PZYDkzcD@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-fv9OwswW@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-L6daSrf0@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-eJxcqGSe@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-cx5f0e2z@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-yvJnUUQ9@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ZGlqjaOU@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-FTTWJ7nF@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-w9XCf4CQ@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ztmx7W4g@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-iVYCy74u@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-idhM8rR5@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-5PCT8wRr@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-APbDADq7@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-vjzE6cAv@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-aOhP9SX3@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-FxaoioDX@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-uRPw0eKk@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Y8ZpydWS@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Uxq7TvXz@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-NxPCk58o@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-ptsHHMhk@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-pQsdhhV8@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-y9oNzeOq@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-PvfPU1L6@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-xUi5xdEL@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-u5qdzUc1@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-4A1gb2Hs@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-TGKMDGyA@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-f79fRQzG@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-sSkprNTn@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-G2LgbnGy@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-Co6evMbR@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-twT4ce3T@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-iuOyi5oF@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-KlbdhLa7@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-6J9WkCaq@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-nbiOxzOc@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-vZwapkdl@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-bN0CEzNS@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-vXkBQjVt@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-g1UDK627@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-XTDGWkNR@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-jtEIn6Kd@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-kEmFZvDh@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-q6NewxUb@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-8M5DcQLs@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-x1AVtbiE@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-YaScjb9Z@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-eUWjGX3o@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-tVjvaEDj@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-hrhid4yz@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-b19pFs7j@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-G1W8M1TK@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-sMklU8wF@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-S1kStgn9@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-v4kyKjkh@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-8g0JFf5Y@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-BAUXk6xe@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-C9VwwKrr@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-OgXWCHzt@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-kyG3Q5eU@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-CigDS2ox@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-kIWwE9tn@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-W4e9vGjA@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-IGj9nj8A@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-i0GtZJsd@209.38.175.3:31112
ipfuqv0e:DC32IceOAF0HMmQp_session-JxDTTfj8@209.38.175.3:31112`

let splited_agents = agents.split("\n")

const websiteKey = '04d28d90-d5b9-4a90-94e5-a12c595bd4e2';
const websiteUrl = 'https://faucet.testnet.initia.xyz/';
const headers = {
    'authority': 'faucet-api.initiation-1.initia.xyz',
    'accept': 'application/json, text/plain,*/*',
    'accept-language': 'zh-CN,zh;q=0.9',
    'cache-control': 'no-cache',
    'content-type': 'text/plain;charset=UTF-8',
    'origin': 'https://faucet.testnet.initia.xyz',
    'pragma': 'no-cache',
    'referer': 'https://faucet.testnet.initia.xyz/',
    'user-agent': fakeUa(),
};

const clientKey = process.env.YES_CAPTCHA_API_KEY;

// 创建验证码任务
async function createTask(websiteUrl, websiteKey, taskType, pageAction) {
    const url = 'https://api.yescaptcha.com/createTask';
    const params = {
        "clientKey": clientKey,
        "task": {
            "websiteURL": websiteUrl,
            "websiteKey": websiteKey,
            "pageAction": pageAction,
            "type": taskType
        },
        // "softID": 'YOUR CLIENT KEY'
    }
    return await sendRequest(url, {method: 'post', data: params})
}

// 获取验证码结果
async function getTaskResult(taskId) {
    const url = 'https://api.yescaptcha.com/getTaskResult';
    const params = {
        clientKey: clientKey,
        taskId: taskId
    }

    const response_data = await sendRequest(url, {method: 'post', data: params})
    const sleep = (minutes) => {
        const milliseconds = minutes * 60 * 1000;
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    };
    await sleep(0.2);
    if (response_data.status === 'ready') {
        return response_data;
    } else if (response_data.status === 'processing') {
        return await getTaskResult(taskId);
    }
}

async function recaptcha(pageAction) {
    const { taskId } = await createTask(websiteUrl, websiteKey, 'HCaptchaTaskProxyless');
    let result = await getTaskResult(taskId);
    // 如果result为空，等待6秒后再次请求
    let retried = 0
    if (!result) {
        while(retried < 10) {
            result = await getTaskResult(taskId);
        }
    }
   
    // 如果再次为空，抛出错误
    if (!result) {
        throw new Error(`${pageAction} 人机验证失败`);
    }
    const { gRecaptchaResponse } = result.solution;
    return gRecaptchaResponse
}

let claimed_at = {}
main()
async function main() {
    console.log(`start.`)
    // const Worker = require('tiny-worker');
    // var worker = new Worker(() => {
    //     onmessage = function (ev) {
    //         postMessage(ev.data);
    //     }
    // });
    // worker.onmessage = function (ev) {
    //     console.log(ev.data);
    //     worker.terminate();
    // };
     
    // worker.postMessage("Hello World!");
    // return

    let proxyVerified = false; // 代理验证标志
            let proxyAttempts = 0; // 代理检查尝试次数
    
            while (!proxyVerified && proxyAttempts < MAX_PROXY_CHECK_ATTEMPTS) {
                console.log('测试代理IP是否正常');
                try {
                    const response = await sendRequest('https://myip.ipip.net', {
                        method: 'get', 
                        httpAgent: agent, 
                        httpsAgent: agent
                    });
                    console.log('验证成功, IP信息: ', response);
                    proxyVerified = true; // 代理验证成功
                } catch (error) {
                    proxyAttempts++;
                    console.log('代理失效，等待1分钟后重新验证');
                    await sleep(60); // 等待1分钟
                }
            }

    while (true) {
        try {
            for (let i = 0; i < accounts.length; i++) {
                try {
                    agent = new HttpsProxyAgent(`http://${splited_agents[i]}`);
                    let address = accounts[i]
                    console.log(`[${i+1}] handing ${address}`);
                    const balances = await lcd.bank.balance(address)
                    console.log(`balances`, balances[0]._coins)
                    if(balances.length > 0 && parseInt(balances[0]._coins.uinit.amount) > 20* 10**6) {
                        console.log(`addrees ${address} 已领取: ${balances[0]._coins.uinit.amount}`);
                        continue
                    }
                    let attempts = 0;
                    while (attempts < MAX_RETRIES) {
                        try {
                            
                            // console.log(await result.promise)
                            // console.log(`finished.`)
                            // return

                            let recaptchaToken = ''
                            while (true) {
                                try {
                                    recaptchaToken = await recaptcha('');
                                    break
                                } catch (e) {
                                    log(`人机验证失败: ${e}`)
                                    await sleep(3000)
                                }
                            }
                            console.log(recaptchaToken)

                         

                            // https://faucet-api.initiation-1.initia.xyz/create_challenge
                            // log(recaptchaToken)
                            // headers['authorization'] = `Bearer ${recaptchaToken}`;

                            let resAltcha = await axios('https://faucet-api.initiation-1.initia.xyz/create_challenge', {
                                headers: headers,
                                httpsAgent: agent,
                                httpAgent: agent,
                            })
                            console.log(resAltcha.data)
                         
                            let result = await solveChallengeWorkers(
                                function() {
                                    let worker = new Worker(function() {
                                        const {solveChallenge} = require('altcha-lib')
                                        let controller = undefined;
                                        onmessage = async (message) => {
                                            const { type, payload } = message.data;
                                            if (type === 'abort') {
                                                controller?.abort();
                                                controller = undefined;
                                            }
                                            else if (type === 'work') {
                                                console.log(payload)
                                                const { alg, challenge, max, salt, start } = payload || {};
                                                const result = solveChallenge(challenge, salt, alg, max, start);
                                                controller = result.controller;
                                                result.promise.then((solution) => {
                                                    console.log(`solution:`, solution)
                                                    self.postMessage(solution ? { ...solution, worker: true } : solution);
                                                });
                                            }
                                        };
                                    })  
                                    return worker
                                }, // Worker script URL or path
                                8, // Spawn 8 workers
                                resAltcha.data.challenge,
                                resAltcha.data.salt,
                                resAltcha.data.algorithm, resAltcha.data.maxnumber
                            )
                            console.log(result)
                         
                            const url = `https://faucet-api.initiation-1.initia.xyz/claim`;
                            const data = {
                                address: address,
                                denom: 'uinit',
                                altcha_payload: btoa(JSON.stringify({
                                    algorithm: resAltcha.data.algorithm,
                                    challenge: resAltcha.data.challenge,
                                    number: result.number,
                                    salt: resAltcha.data.salt,
                                    signature: resAltcha.data.signature,
                                    took: result.took
                                })),
                                h_captcha: recaptchaToken,
                            };
                            const urlConfig = {
                                headers: headers,
                                httpsAgent: agent,
                                httpAgent: agent,
                            };

                            const response = await axios.post(url, data, urlConfig);
                            const amount = response.data.amount;
                            console.log(`领取成功✅ ${address}`, amount);
                            // console.log('领取成功✅，地址：', address);
                            // claimed_at[address] = new Date().valueOf()
                            attempts = MAX_RETRIES;
                        } catch (error) {
                            log(`error`, error)
                            if(error.response && error.response.data.msg) {
                                console.error(`领取失败❌，地址：${address}: ${error.response.data.msg}`);
                            }
                            attempts++;
                            if(attempts < MAX_RETRIES) {
                                console.log(`地址${address}正在重试第 ${attempts} 次...`);
                                await sleep(5);
                            } else {
                                claimed_at[address] = new Date().valueOf()
                            }
                          

                            // if (error.response && error.response.data.msg === 'Faucet is overloading, please try again') {
                               
                            // } else {
                            //     console.error(`领取失败❌，地址：${address}: ${error.response.data.msg}`);
                            //     break; // 如果是非重试的错误，退出循环
                            // }
                        }
                    }
                    // 暂停一段时间
                    const pauseTime = getRandomInt(200, 1000)
                    console.log(`任务完成，线程暂停${pauseTime}毫秒`);
                    await sleep(pauseTime);
                } catch (e) {
                    log(`error. ${e}`)
                }
            }
            log(`完成一轮, 休息一会`);
            await sleep(5 * 60 * 1000)
        } catch (e) {
            log(`error.`, e)
        }


    }

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function sendRequest(url, urlConfig, timeout = 10000) {
    const source = axios.CancelToken.source();
    const timer = setTimeout(() => {
        source.cancel(`Request timed out after ${timeout} ms`);
    }, timeout);

    const newConfig = {
        ...urlConfig,
        url: url,
        timeout: timeout,
        cancelToken: source.token,
        method: urlConfig.method || 'get',
        onDownloadProgress: () => clearTimeout(timer),
    };

    try {
        const response = await axios(newConfig);
        if(response && response.data) {
            return response.data;
        } else {
            throw 'request error'
        }
       
    } catch (error) {
        log(error, error)
        throw error;
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
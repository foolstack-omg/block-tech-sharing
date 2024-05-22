const {ethers} = require('ethers')

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

module.exports = {
    parseSignature
}
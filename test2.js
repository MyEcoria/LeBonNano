const crypto = require('./modules/crypto.js');

async function test() {
    const account = await crypto.receiveAll("nano_3f66iz4fabqmunk4zbc75j44s741ibpgqxq1oxzi16rsu4igmmndcjyfgu3u");
    console.log(account);
}

test();
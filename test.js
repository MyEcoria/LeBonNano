const crypto = require('./modules/crypto.js');
const login = require('./modules/login.js');

async function test() {
    const account = await crypto.generateWallet(1);
    console.log(account);
    const logan = await login.getWallet(account[0]);
    console.log(logan);

}

test();
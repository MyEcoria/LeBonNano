const axios = require('axios');
const key = require('../config/apiKeys.json');

const rpcUrl = 'https://nodes.nanswap.com/XNO';
const customAxios = axios.create({
  baseURL: rpcUrl,
  headers: {
    'nodes-api-key': key["nanswap"]
  }
});

async function getNanoScore(address, ip) {
  const isResidential = await axios.get(`https://ipwhois.app/json/${ip}?objects=ip,isp,proxy,vpn,tor`)
    .then(response => response.data)
    .then(data => {
      const proxyTypes = ['VPN', 'TOR', 'PROXY'];
      return !data.proxy || proxyTypes.some(type => data[type.toLowerCase()]);
    });

  const accountInfo = await customAxios.post('', {
    action: 'account_info',
    account: address,
    representative: true,
    weight: true,
    pending: true
  })
    .then(response => response.data);

  const openBlock = accountInfo?.frontier || '';
  const openTimestamp = await customAxios.post('', {
    action: 'block_info',
    json_block: 'true',
    block: openBlock
  })
    .then(response => response.data?.local_timestamp || 0);

  let score = 0;

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const timeDifference = currentTimestamp - openTimestamp;
  if (timeDifference <= 604800) {
    score += 1;
  } else if (timeDifference <= 2592000) {
    score += 4;
  } else if (timeDifference <= 31536000) {
    score += 6;
  } else {
    score += 10;
  }

  const balanceNano = accountInfo?.balance || '';
  const balance = parseFloat(balanceNano);
  console.log(balance);
  if (balance >= 1000) {
    score += 10;
  } else if (balance >= 100) {
    score += 8;
  } else if (balance >= 10) {
    score += 6;
  } else if (balance >= 1) {
    score += 4;
  } else if (balance >= 0.1) {
    score += 2;
  } else if (balance >= 0.001) {
    score += 1;
  }

  if (isResidential === true) {
    score += 5;
  }
  console.log(score);

  const totalScore = 30/6;
  console.log(totalScore);
  const someScore = Math.floor(totalScore * 10) / 10;
  const lastScore = Math.floor(someScore);
  console.log(lastScore);
  return lastScore;
}

module.exports = {
  getNanoScore
};

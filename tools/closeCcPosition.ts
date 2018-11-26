// Ad-hoc script to close all leverage positions in Coincheck.

import CoincheckApi from '../src/Coincheck/BrokerApi';
import { CashMarginType } from '../src/types';
import { options } from '@bitr/logger';
import { getConfigRoot, findBrokerConfig } from '../src/configUtil';

options.enabled = false;

async function main() {
  const config = getConfigRoot();
  const ccConfig = findBrokerConfig(config, 'Coincheck');
  const ccApi = new CoincheckApi(ccConfig.key, ccConfig.secret);

  if(ccConfig.enabled){
    if (CashMarginType.Cash === ccConfig.cashMarginType) {
      const ccBalance = await ccApi.getAccountsBalance();
      if (ccBalance.btc > 0){
        const request = {
          pair: 'btc_jpy',
          order_type: 'market_sell',
          amount: ccBalance.btc,
        };
        console.log(`Market selling ${ccBalance.btc}...`);
        const reply = await ccApi.newOrder(request as any);
        if (!reply.success) {
          console.log(reply);
        } else {
          console.log(`Market sell was sent.`);
        }
      }
    } else {
      const positions = await ccApi.getAllOpenLeveragePositions();
      for (const position of positions) {
        const request = {
          pair: 'btc_jpy',
          order_type: position.side === 'buy' ? 'close_long' : 'close_short',
          amount: position.amount,
          position_id: position.id
        };
        console.log(`Closing position id ${position.id}...`);
        const reply = await ccApi.newOrder(request as any);
        if (!reply.success) {
          console.log(reply);
        } else {
          console.log(`Close order was sent.`);
        }
      }
    }
  }
}

main();

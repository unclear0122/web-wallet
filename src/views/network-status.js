
import { WalletManager } from '../lib/wallet-manager';
import { WalletApi } from '../lib/wallet-api';

export class NetworkStatus {

    static inject() { return [WalletManager, WalletApi]; }

    constructor(walletManager, walletApi) {

        this.walletManager = walletManager;
        this.walletApi = walletApi;

        this.blockHeight = 0;

    }

    attached() {
        this.walletApi.getNodeInfo().then(response => {
            this.blockHeight = response.blocks;
            // response.moneysupply = 83533050
            // response.paytxfee = 0.01000000
            // response.difficulty = 1974447.61998484
        });
    }

}





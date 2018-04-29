
import { WalletApi } from '../lib/wallet-api';

export class Roadmap {

    static inject() { return [WalletApi]; }

    constructor(walletApi) {
        this.walletApi = walletApi;
    }

    attached() {
        this.walletApi.getDevelopmentRoadmap().then((roadmap) => {
            for (let i = 0; i < roadmap.features.length; i++) {
                roadmap.features[i].priority = i+1;
            }
            this._roadmap = roadmap;
        });
    }

    itemClicked() {}

}





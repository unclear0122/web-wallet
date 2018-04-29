
import { WalletManager } from 'lib/wallet-manager';

export class WalletUnlockScreen {

    static inject() { return [WalletManager]; }

    constructor(walletManager) {

        document.body.className = "wallet-unlock";

        this.walletManager = walletManager;
        this.password = undefined;
        this.error = undefined;

    }

    attached() {
        document.nprogress.done();
        this.error = undefined;
    }

    unlockWallet() {
        this.walletManager.unlockWallet(this.password.trim()).then(() => {
        }).catch(error => {
            if (error.sanitized) {
                this.error = error.message;
            } else {
                this.error = 'An error occurred';
                console.log(error);
            }
        });
    }

}





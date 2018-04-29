
import { EventAggregator } from 'aurelia-event-aggregator';
import { WalletManager } from '../lib/wallet-manager';

import { UI } from '../lib/ui-assist';

import * as walletLib from '../lib/wallet-lib';


export class ImportAddress {

    static inject() { return [EventAggregator, WalletManager]; }

    constructor(eventAggregator, walletManager) {

        this.eventAggregator = eventAggregator;
        this.walletManager = walletManager;

        this.selectedAction = undefined;

        this.address = undefined;
        this.label = undefined;
        this.privkey = undefined;
        this.error = undefined;

        this.isValidAddress = false;
        this.isValidPrivateKey = false;

        this.addressTypeOptions = [
            {
                label: "Import a watch-only address",
                value: 'import_watch_only_address'
            },{
                label: "Import a spendable address",
                value: 'import_spendable_address'
            }
        ];

    }

    activate(model) {

        if (model && model.modal) {
            this.modal = model.modal;
        }

        this.address = undefined;
        this.label = undefined;
        this.privkey = undefined;
        this.error = undefined;

        this.validateAddress();

    }

    attached() {
        this.selectedAction = 'import_watch_only_address';
    }

    get isImportingWatchOnlyAddress() {
        return (this.selectedAction && this.selectedAction === 'import_watch_only_address') ? true : false;
    }

    get isImportingSpendableAddress() {
        return (this.selectedAction && this.selectedAction === 'import_spendable_address') ? true : false;
    }

    isRequiredParamsValid() {
        if (this.selectedAction === 'import_spendable_address') {
            return (this.isValidPrivateKey && this.address) ? true : false;
        } else {
            return (this.isValidAddress) ? true : false;
        }
    }

    validateAddress() {
        if (!this.address) {
            this.isValidAddress = false;
        } else {
            if (this.address.length > 32) {
                this.isValidAddress = this.address.startsWith('B') ? true : false;
                if (!this.isValidAddress) {
                    this.error = 'Invalid Address';
                } else {
                    if (walletLib.isValidAddress(this.address)) {
                        this.isValidAddress = true;
                        this.error = null;
                    } else {
                        this.isValidAddress = false;
                        this.error = 'Invalid Address';
                    }
                }
            } else {
                this.isValidAddress = false;
            }
        }
        if (this.modal) {
            if (this.isRequiredParamsValid()) {
                this.modal.confirm.disabled = false;
            } else {
                this.modal.confirm.disabled = true;
            }
        }
    }

    validatePrivateKey() {
        if (!this.privkey) {
            this.isValidPrivateKey = false;
        } else {
            if (this.privkey.length > 44) {
                try {
                    this.address = walletLib.deriveAddressFromPrivateKey(this.privkey);
                    this.isValidPrivateKey = true;
                    this.error = null;
                } catch (e) {
                    this.error = 'Invalid Private Key';
                    this.address = null;
                    this.isValidPrivateKey = false;
                }
            } else {
                this.isValidPrivateKey = false;
            }
        }
        if (this.modal) {
            if (this.isRequiredParamsValid()) {
                this.modal.confirm.disabled = false;
            } else {
                this.modal.confirm.disabled = true;
            }
        }
    }

    actionSelected() {
        let that = this;
        setTimeout(function () {
            that.address = undefined;
            that.label = undefined;
            that.privkey = undefined;
            that.error = undefined;
            if (that.modal) {
                if (that.isRequiredParamsValid()) {
                    that.modal.confirm.disabled = false;
                } else {
                    that.modal.confirm.disabled = true;
                }
            }
        }, 100);
    }

    importExternalAddress() {
        let progress = UI.progress.startWithLoader(4000);
        this.walletManager.importExternalAddress(this.address, this.label, this.privkey).then(isvalid => {
            progress.end();
        }).catch(error => {
            progress.end();
            if (error.sanitized) {
                this.error = error.message;
            } else {
                this.error = 'Unknown error';
                console.log(error);
            }
        });
    }

}


import { EventAggregator } from 'aurelia-event-aggregator';

import { WalletManager } from '../lib/wallet-manager';
import { isObject } from '../lib/lang';

import * as walletLib from '../lib/wallet-lib';


export class AddressBookAdd {

    static inject() { return [EventAggregator, WalletManager]; }

    constructor(eventAggregator, walletManager) {

        this.eventAggregator = eventAggregator;
        this.walletManager = walletManager;

        this.address = undefined;
        this.label = undefined;
        this.error = undefined;

        this.isValidAddress = false;

    }

    activate(model) {

        if (model && model.modal) {
            this.modal = model.modal;
        }

        this.address = undefined;
        this.label = undefined;
        this.error = undefined;

        this.validateAddress();

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
        if (this.modal && this.isValidAddress) {
            this.modal.confirm.disabled = false;
        } else {
            this.modal.confirm.disabled = true;
        }
    }

    addAddress() {
        let that = this;
        setTimeout(function () {
            that.walletManager.addToAddressBook(that.address, that.label).then(isvalid => {
                that.eventAggregator.publish('address-book-added', { status: 'success' });
            }).catch(error => {
                if (error.sanitized) {
                    that.error = error.message;
                } else {
                    that.error = 'Unknown error';
                    console.log(error);
                }
            });
        }, 100);
    }

}

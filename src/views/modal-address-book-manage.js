
import { bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

import { WalletManager } from '../lib/wallet-manager';

import * as walletLib from '../lib/wallet-lib';


export class ManageAddress {

    static inject() { return [EventAggregator, WalletManager]; }

    constructor(eventAggregator, walletManager) {

        this.eventAggregator = eventAggregator;
        this.walletManager = walletManager;

        this.label = undefined;
        this.address = undefined;

    }

    activate(model) {

        let addr = undefined;
        if (model && model.data) {
            addr = model.data;
            if (addr) {
                this.label = addr.label;
                this.address = addr.address;
                this.oldLabel = addr.label;
                this.oldAddress = addr.address;
            }
        }

        this.error = null;
        this.isValidAddress = false;

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
    }

    updateAddress() {
        let hasUpdate = false;
        let update = {
            label: undefined,
            address: undefined
        }
        if (this.oldLabel !== this.label) {
            hasUpdate = true;
            if (!this.label || this.label.trim() == "") {
                update.label = 'DEL';
            } else {
                update.label = this.label.trim();
            }
        }
        if (this.oldAddress !== this.address) {
            hasUpdate = true;
            if (!this.address || this.address.trim() == "") {
                throw new Error('Address cannot be empty');
            } else {
                update.address = this.address.trim();
            }
        }
        if (hasUpdate) {
            this.walletManager.updateAddressBook(this.oldAddress, update).then(() => {
                this.eventAggregator.publish('address-book-updated', { status: 'success' });
            });
        } else {
            this.eventAggregator.publish('address-book-updated', { status: 'success' });
        }
    }

    removeAddress() {
        if (confirm("Are you sure you want to remove this address?")) {
            this.walletManager.removeFromAddressBook(this.oldAddress).then(() => {
                this.eventAggregator.publish('address-book-updated', { status: 'success' });
            });
        } else {
            this.eventAggregator.publish('address-book-updated', { status: 'success' });
        }
    }

}

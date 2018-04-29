
import { bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { WalletManager } from '../lib/wallet-manager';
import * as walletLib from '../lib/wallet-lib';


export class ManageAddress {

    static inject() { return [EventAggregator, WalletManager]; }

    @bindable address = null;

    constructor(eventAggregator, walletManager) {

        this.eventAggregator = eventAggregator;
        this.walletManager = walletManager;

        this.label = undefined;
        this.address = undefined;
        this.privkey = undefined;
        this.isExternalAddress = true;

    }

    activate(model) {

        if (model && model.modal) {
            this.modal = model.modal;
        }

        let addr = undefined;
        if (model && model.data) {
            addr = model.data;
            if (addr) {
                this.label = addr.label;
                this.address = addr.address;
                this.privkey = addr.privkey;
                this.oldLabel = addr.label;
                this.oldAddress = addr.address;
                this.oldPrivKey = addr.privkey;
                this.isExternalAddress = addr.isexternal;
            }
        }

        if (this.modal && addr && addr.isprimary) {
            this.modal.deny.show = false;
        }

        this.info = null;
        this.error = null;
        this.isValidPrivateKey = false;
        this.isValidAddress = false;

        this.validateAddress();

    }

    isRequiredParamsValid() {
        if (this.privkey) {
            return (this.isValidPrivateKey && this.isValidAddress) ? true : false;
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
                    this.info = null;
                } else {
                    if (walletLib.isValidAddress(this.address)) {
                        this.isValidAddress = true;
                        this.error = null;
                        this.info = null;
                        this.validatePrivateKey(false);
                    } else {
                        this.isValidAddress = false;
                        this.error = 'Invalid Address';
                        this.info = null;
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

    validatePrivateKey(overrideAddress) {
        if (overrideAddress !== false) {
            overrideAddress = true;
        }
        if (!this.privkey) {
            this.isValidPrivateKey = true;
            this.error = null;
            this.info = null;
        } else {
            if (this.privkey.length > 44) {
                try {
                    let derivedAddress = walletLib.deriveAddressFromPrivateKey(this.privkey);
                    if (!derivedAddress) {
                        this.isValidPrivateKey = false;
                        this.error = 'Invalid Private Key';
                        this.info = null;
                    } else {
                        if (!this.address) {
                            this.address = derivedAddress;
                            this.isValidPrivateKey = true;
                            this.isValidAddress = true;
                            this.error = null;
                            this.info = null;
                        } else if (this.address !== derivedAddress) {
                            if (overrideAddress) {
                                this.address = derivedAddress;
                                this.isValidPrivateKey = true;
                                this.isValidAddress = true;
                                this.error = null;
                                this.info = 'The private key entered is for a different address than the previously existing one. The address field has been updated to reflect the address matching this private key';
                            } else {
                                this.isValidPrivateKey = true;
                                this.isValidAddress = false;
                                this.error = 'The supplied address is not valid against the supplied private key';
                                this.info = null;
                            }
                        } else { // this.address === derivedAddress
                            this.isValidPrivateKey = true;
                            this.isValidAddress = true;
                            this.error = null;
                            this.info = null;
                        }
                    }
                } catch (e) {
                    this.isValidPrivateKey = false;
                    this.error = 'Invalid Private Key';
                    this.info = null;
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

    updateAddress() {
        let hasUpdate = false;
        let update = {
            label: undefined,
            address: undefined,
            privkey: undefined
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
        if (this.oldPrivKey !== this.privkey) {
            hasUpdate = true;
            if (!this.privkey || this.privkey.trim() == "") {
                update.privkey = 'DEL';
            } else {
                update.privkey = this.privkey.trim();
            }
        }
        if (hasUpdate) {
            this.walletManager.updateAddress(this.oldAddress, update).then(() => {
                this.eventAggregator.publish('address-updated', { status: 'success' });
            });
        } else {
            this.eventAggregator.publish('address-updated', { status: 'success' });
        }
    }

    removeAddress() {
        if (confirm("Are you sure you want to remove this address?")) {
            this.walletManager.removeAddress(this.oldAddress).then(() => {
                this.eventAggregator.publish('address-updated', { status: 'success' });
            });
        } else {
            this.eventAggregator.publish('address-updated', { status: 'success' });
        }
    }

}

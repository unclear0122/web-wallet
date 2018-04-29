
import { PLATFORM } from 'aurelia-pal';
import { Router } from 'aurelia-router';
import { Aurelia } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';

import * as AES from 'crypto-js/aes';
import * as ENC_UTF8 from 'crypto-js/enc-utf8';
import * as cloneDeep from 'lodash.clonedeep';

import * as lang from './lang.js';

import { WalletApi } from './wallet-api';
import { UI } from './ui-assist';


const DEV_MODE = false;

const BALANCE_POLL_INTERVAL_SECONDS = 180;
const MAX_STALE_REGISTRATION_SECONDS = 240;

const MSG_API_UNUATHORIZED = 'Unauthorized API service call';
const MSG_API_UNAVAILABLE = 'The service API appears to be unavailable';
const MSG_API_NETWORK_COMS_ERROR = 'The service API experienced a network communication failure';

const CONSTANTS = {
    WALLET_ID_PREFIX: 'BWW',
    WALLET_ID_DELIMETER: '-',
    MAX_INTERNAL_ADDRESSES: 3,
    MAX_IMPORTED_ADDRESSES: 7,
    MAX_ADDRESS_BOOK_ENTRIES: 10,
    MAX_PAY_HISTORY: 30,
    MAX_TX_HISTORY: 100,
    MIN_TX_CONFIRMATIONS: 10,
    MASTERNODE_AMOUNT: 50000,
}


let initState = function() {
    return {
        totalBalance: 0,
        spendableBalance: 0,
        addresses: []
    };
}

let resetAddressBalance = function(address) {
    address.balance = {
        amount: 0,
        spendable: 0
    }
}

let cloneAddressWithFreshState = function(address) {
    let clone = cloneDeep(address);
    resetAddressBalance(clone);
    return clone;
}


export class WalletManager {

    static inject() { return [Aurelia, Router, EventAggregator, WalletApi]; }

    constructor(aurelia, router, eventAggregator, walletApi) {

        this.aurelia = aurelia;
        this.router = router;
        this.eventAggregator = eventAggregator;
        this.walletApi = walletApi;

        this.wallet = undefined;
        this.passwd = undefined;
        this.active = initState();
        this.isUpdatingActiveAddresses = false;
        this.stateUpdateCounter = 0;

        this.txHistory = undefined;
        this.addressBook = undefined;

        this.notification = undefined;
        this.notificationType = undefined;

        if (DEV_MODE) {
            this._loadWallet();
        }

        let self = this;
        let updateBalance = setInterval(function () {
            if (self.wallet) {
                if (
                    (!self.active.notification) ||
                    (self.notification && (self.notification !== MSG_API_UNAVAILABLE && self.notification !== MSG_API_NETWORK_COMS_ERROR))
                ) {
                    try {
                        UI.log.info('Balance update poll');
                        self.updateBalances(true);
                    } catch (e) {
                        console.log('Failed to poll for balance updates');
                        console.log(e);
                    }
                }
            }
        }, 1000 * BALANCE_POLL_INTERVAL_SECONDS);
        // clearInterval(updateBalance);

    }

    get CONST() {
        return CONSTANTS;
    }

    get notificationStyle() {
        if (this.notificationType) {
            return 'alert alert-' + this.notificationType + ' alert-dismissible fade show text-center'
        } else {
            return 'alert alert-info alert-dismissible fade show text-center'
        }
    }

    get hasNotification() {
        return (this.notification && this.notification != "") ? true : false;
    }

    dismissNotification() {
        this.notification = null;
        this.notificationType = null;
    }

    showNotification(message, type) {
        this.notification = message;
        this.notificationType = type;
    }

    isWalletLocked() {
        return (this.wallet && this.wallet.id) ? false : true;
    }

    hasLocalStorageWallet() {
        let w = localStorage.getItem('wdata') || null;
        if (w && w !== 'null') {
            return true;
        }
        return false;
    }

    _loadWallet(password) {
        if (DEV_MODE) {
            let w = localStorage.getItem('wdata') || null;
            if (w && w !== 'null') {
                this.wallet = JSON.parse(w);
                return true;
            }
            return false;
        } else {
            let w = localStorage.getItem('wdata') || null;
            if (w && w !== 'null') {
                try {
                    let decrypted = JSON.parse(AES.decrypt(w, password).toString(ENC_UTF8));
                    if (decrypted.id) {
                        UI.log.info('Wallet successfully unlocked [' + decrypted.id + ']');
                        this.passwd = password;
                        this.wallet = decrypted;
                        return true;
                    }
                } catch (e) {
                    UI.log.error('Wallet decryption failed');
                    //UI.log.error(e);
                    return false;
                }
            }
            return false;
        }
    }

    _saveWallet(password) {
        if (!password && this.passwd) {
            password = this.passwd;
        }
        if (this.wallet) {
            /*
            if (this.wallet.addresses) {
                for (let address of this.wallet.addresses) {
                    if (address.balance) {
                        delete address.balance;
                    }
                    if (address.utxos) {
                        delete address.utxos;
                    }
                }
            }
            if (this.wallet.ext) {
                let addresses = Object.keys(this.wallet.ext);
                if (addresses.length > 0) {
                    for (let address of addresses) {
                        if (this.wallet.ext[address].balance) {
                            delete this.wallet.ext[address].balance;
                        }
                        if (this.wallet.ext[address].utxos) {
                            delete this.wallet.ext[address].utxos;
                        }
                    }
                }
            }
            */
            if (DEV_MODE) {
                localStorage['wdata'] = JSON.stringify(this.wallet);
            } else {
                try {
                    let encrypted = AES.encrypt(JSON.stringify(this.wallet), password).toString();
                    localStorage['wdata'] = encrypted;
                } catch (e) {
                    UI.log.error('Wallet encryption failed');
                    UI.log.error(e);
                    throw new Error('Wallet encryption failed.');
                }
            }
        }
    }

    deleteWallet() {
        localStorage['wdata'] = null;
        //localStorage['txhist'] = null;
        this.wallet = null;
        this.active = null;
        this.router.navigate('/', { replace: true, trigger: false });
        this.router.reset();
        this.router.deactivate();
        this.aurelia.setRoot(PLATFORM.moduleName('wallet-init'), document.body);
        document.body.className = "wallet-init";
    }

    getActiveAddresses() {
        return new Promise((resolve, reject) => {
            if (this.active && this.active.addresses && this.active.addresses.length > 0) {
                resolve(this.active);
            } else {
                resolve(null);
            }
        });
    }

    _startStateUpdate() {
        let oldState = this.active;
        this.isUpdatingActiveAddresses = true;
        this.active = initState();
        return oldState;
    }

    _finishStateUpdate(error, skipStateUpdateEventTrigger) {
        this.isUpdatingActiveAddresses = false;
        if ((!error) && (!skipStateUpdateEventTrigger)) {
            this.eventAggregator.publish('active-state-updated', { status: 'success' });
        }
    }

    _loadActiveAddresses(rescanUnregisteredAddressesForBalanceInfo, updateBalances) {
        let rescan = (rescanUnregisteredAddressesForBalanceInfo === false) ? false : true;
        return new Promise((resolve, reject) => {
            if (this.isUpdatingActiveAddresses) {
                //UI.log.info('State update already in progress');
                resolve('State update already in progress');
            } else {
                let now = Math.floor(Date.now() / 1000);
                let oldState = this._startStateUpdate();
                return this.getAllAddresses().then(allAddresses => {
                    return this.walletApi.isAddressListRegistered(allAddresses, true).then(addresses => {
                        let foundUnregisteredButSubmitted = false;
                        let unregistered = [];
                        for (let address of addresses) {
                            if (address.isexternal || address.isactive || address.isprimary) {
                                if ((address.submitted) && (!address.isregistered)) {
                                    let scanAge = now - address.submitted;
                                    if (scanAge > MAX_STALE_REGISTRATION_SECONDS) {
                                        UI.log.info('Found address which has already been submitted for registration, but seems the process has become stale: ' + address.address + ' ' + scanAge);
                                        unregistered.push(address);
                                    } else {
                                        UI.log.info('Found address which is in the process of being registered: ' + address.address + ' ' + scanAge);
                                        foundUnregisteredButSubmitted = true;
                                    }
                                } else if ((!address.submitted) && (!address.isregistered)) {
                                    UI.log.info('Found address which is not registered: ' + address.address);
                                    unregistered.push(address);
                                } else if ((address.submitted) && (address.isregistered)) {
                                    //UI.log.info('Found address which was submitted, but is now registered: ' + address.address + ' ' + address.submitted);
                                }
                                this.active.addresses.push(cloneAddressWithFreshState(address));
                            }
                        }
                        if (unregistered.length > 0) {
                            this.showNotification('Scanning blockchain for address balance info. It may take a minute or two.');
                        } else if (foundUnregisteredButSubmitted) {
                            this.showNotification('Blockchain scan in progress.');
                        } else if (this.hasNotification) {
                            this.dismissNotification();
                        }

                        return this._registerAddressList(unregistered, rescan).then((submitted) => {
                            if (updateBalances === false) {
                                this._finishStateUpdate(null, true);
                                resolve();
                            } else {
                                this.updateBalances(false).then(() => {
                                    this._finishStateUpdate();
                                    resolve();
                                });
                            }
                        });
                    });
                }).catch(error => {
                    let e = this._sanitizeError(error);
                    this.showNotification(e.message, 'danger');
                    this._finishStateUpdate(e);
                    console.log(e);
                    reject(e);
                });
            }
        });
    }

    _sanitizeError(error) {
        if (error && error.sanitized) {
            return error;
        }
        if (error && error.statusCode && error.statusCode === 401) {
            return { sanitized: true, message: MSG_API_UNUATHORIZED, error: error };
        } else if (error && error.statusCode && error.statusCode === 503) {
            return { sanitized: true, message: MSG_API_NETWORK_COMS_ERROR, error: error };
        } else if (error && error.hasOwnProperty('statusCode') && error.statusCode === 0) {
            return { sanitized: true, message: MSG_API_UNAVAILABLE, error: error };
        } else if (error && error.message) {
            return { sanitized: true, message: error.message, error: error };
        } else if (error && lang.isString(error)) {
            return { sanitized: true, message: error, error: null };
        } else if (error) {
            return { sanitized: true, message: 'Internal Error', error: error };
        } else {
            return { sanitized: true, message: 'Unknown Error', error: null };
        }
    }

    _registerAddressList(addresses, rescan) {
        return new Promise((resolve, reject) => {
            if (!addresses || addresses.length === 0) {
                resolve();
            } else {
                let addressList = addresses.map(function(address) { return address.address; });
                this.walletApi.registerWatchOnlyAddressList(addressList, rescan).then((result) => {
                    this._markAsSubmittedForRegistration(addressList);
                    resolve(result);
                }).catch(error => {
                    reject(this._sanitizeError(error));
                });
            }
        });
    }

    _markAsSubmittedForRegistration(addressList) {
        let now = Math.floor(Date.now() / 1000);
        for (let address of addressList) {
            let matchedAddress = undefined;
            if ((this.wallet.ext) && (this.wallet.ext[address])) {
                matchedAddress = this.wallet.ext[address];
            } else {
                for (let a of this.wallet.addresses) {
                    if (a.address === address) {
                        matchedAddress = a;
                        break;
                    }
                }
            }
            if (matchedAddress) {
                matchedAddress.submitted = now;
            }
        }
        this._saveWallet();
    }

    updateBalances(reloadActiveAddresses) {
        return new Promise((resolve, reject) => {

            if (reloadActiveAddresses) {
                this._loadActiveAddresses(true, false).then(() => {
                    resolve();
                }).catch(error => {
                    reject(error);
                });
            } else {
                resolve();
            }

        }).then(() => {

            this.active.totalBalance = 0;
            this.active.spendableBalance = 0;
            for (let address of this.active.addresses) {
                resetAddressBalance(address);
            }

            let now = Math.floor(Date.now() / 1000);

            let internalTxHistory = this.getTxHistory();
            let changeReceived = {};
            let expectedChangeReturns = {};
            let spentInputsInHistory = {};
            for (let tx of internalTxHistory) {
                let txAge = now - tx.date;
                if (txAge < 1200) {
                    //UI.log.info('Found a potential future change return: ' + tx.changeAddress + ', ' + tx.changeAmount);
                    if (!changeReceived[tx.changeAddress]) {
                        changeReceived[tx.changeAddress] = [];
                    }
                    changeReceived[tx.changeAddress].push({
                        txid: tx.txid,
                        changeAmount: tx.changeAmount
                    })
                    expectedChangeReturns[tx.txid] = {
                        changeAmount: tx.changeAmount,
                        changeAddress: tx.changeAddress
                    }
                }
                for (let input of tx.inputs) {
                    if (!spentInputsInHistory[input.txid]) {
                        spentInputsInHistory[input.txid] = [];
                    }
                    spentInputsInHistory[input.txid].push(input.address);
                }
            }

            let prefs = this.getPreferences();
            let lockMasternodeFunds = (prefs && prefs.lockMasternodeFunds && (prefs.lockMasternodeFunds === 'false' || prefs.lockMasternodeFunds === false)) ? false : true;
            let activeAddressList = this.active.addresses.map(function(address) { return address.address; });
            return this.walletApi.getSpendableOutputsForAddress(activeAddressList).then(utxos => {

                if (utxos && utxos.length > 0) {
                    for (let address of this.active.addresses) {
                        address.utxos = [];
                        for (let utxo of utxos) {
                            if (utxo.address === address.address) {
                                if (expectedChangeReturns[utxo.txid] && (expectedChangeReturns[utxo.txid].changeAddress === address.address) && (expectedChangeReturns[utxo.txid].changeAmount == utxo.amount)) {
                                    UI.log.info('Found an actual change return transaction for an expected future change value, removing the expected future value');
                                    for (let entry of changeReceived[address.address]) {
                                        if (entry.txid === utxo.txid) {
                                            entry.changeAmount = 0;
                                        }
                                    }
                                }
                                //if ((utxo.address === address.address) && (utxo.confirmations > CONSTANTS.MIN_TX_CONFIRMATIONS)) {
                                if (spentInputsInHistory[utxo.txid] && spentInputsInHistory[utxo.txid].indexOf(utxo.address) > -1) {
                                    UI.log.info('Found transaction that has already been spent: ' + utxo.txid + ' from ' + utxo.address);
                                } else {
                                    //UI.log.info('Adding utxo: ' + utxo.txid + ' from ' + utxo.address);
                                    address.utxos.push(utxo);
                                    if (utxo.amount) {
                                        address.balance.amount = address.balance.amount+utxo.amount;
                                        if (address.privkey) {
                                            if (lockMasternodeFunds && utxo.amount === CONSTANTS.MASTERNODE_AMOUNT) {
                                                //UI.log.info('Excluding potential MN utxo: ' + utxo.txid + ' from ' + utxo.address);
                                            } else if (utxo.confirmations <= CONSTANTS.MIN_TX_CONFIRMATIONS) {
                                                //UI.log.info('Excluding utxo with confirmations below minimum allowed: ' + utxo.txid + ' from ' + utxo.address);
                                            } else {
                                                address.balance.spendable = address.balance.spendable+utxo.amount;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (changeReceived[address.address]) {
                            for (let tx of changeReceived[address.address]) {
                                if (tx.changeAmount > 0) {
                                    UI.log.info('Adding an expected future change return: ' + address.address + ', ' + tx.changeAmount);
                                    address.balance.amount = address.balance.amount+tx.changeAmount;
                                }
                            }
                        }
                    }
                }

                for (let address of this.active.addresses) {
                    if (address.balance && address.balance.amount) {
                        this.active.totalBalance = this.active.totalBalance+address.balance.amount;
                    }
                    if (address.balance && address.balance.spendable) {
                        this.active.spendableBalance = this.active.spendableBalance+address.balance.spendable;
                    }
                }

                this.eventAggregator.publish('active-state-updated', { status: 'success' });
                return Promise.resolve(this.active);

            }).catch(error => {
                return Promise.reject(this._sanitizeError(error));
            });

        }).catch(error => {
            return Promise.reject(this._sanitizeError(error));
        });
    }

    importExternalAddress(address, label, privkey) {
        return new Promise((resolve, reject) => {
            if (!this.wallet.ext) {
                this.wallet.ext = {};
            }
            let keys = Object.keys(this.wallet.ext);
            if (keys.length >= CONSTANTS.MAX_IMPORTED_ADDRESSES) {
                return reject(this._sanitizeError('Max allowed address imports reached'));
            }
            if (this.wallet.ext[address]) {
                return reject(this._sanitizeError('Address already exists'));
            }
            return this.walletApi.getAddressInfo(address).then(addressInfo => {
                if (!addressInfo) {
                    reject(this._sanitizeError('Failed to validate address'));
                } else if (!addressInfo.isvalid) {
                    reject(this._sanitizeError('Invalid address'));
                } else {
                    this.wallet.ext[address] = {
                        address: address,
                        label: (label && label != "") ? label : undefined,
                        privkey: (privkey && privkey != "") ? privkey : undefined,
                        isexternal: true
                    };
                    this._saveWallet();
                    this.eventAggregator.publish('address-imported', { status: 'success' });
                    this._loadActiveAddresses().then(() => {
                        resolve();
                    });
                }
            }).catch(error => {
                reject(this._sanitizeError(error));
            });
        });
    }

    removeAddress(address) {
        return new Promise((resolve, reject) => {
            if (address) {
                if ((this.wallet.ext) && (this.wallet.ext[address])) {
                    delete this.wallet.ext[address];
                } else {
                    for (let a of this.wallet.addresses) {
                        if (a.address === address) {
                            a.isactive = false;
                        }
                    }
                }
                let updatedState = [];
                for (let a of this.active.addresses) {
                    if (a.address !== address) {
                        updatedState.push(a);
                    }
                }
                this.active.addresses = updatedState;
                this._saveWallet();
                this._loadActiveAddresses();
                resolve();
            } else {
                resolve();
            }
        });
    }

    updateAddress(address, update) {
        return new Promise((resolve, reject) => {
            if (address && update) {
                let addressChanged = (update.address && update.address !== address) ? true : false;
                let matchedAddress = undefined;
                if ((this.wallet.ext) && (this.wallet.ext[address])) {
                    if (addressChanged) {
                        let old = this.wallet.ext[address];
                        this.wallet.ext[update.address] = old;
                        this.wallet.ext[update.address].address = update.address;
                        matchedAddress = this.wallet.ext[update.address];
                        delete this.wallet.ext[address];
                    } else {
                        matchedAddress = this.wallet.ext[address];
                    }
                } else {
                    for (let a of this.wallet.addresses) {
                        if (a.address === address) {
                            if (addressChanged) {
                                a.address = update.address;
                            }
                            matchedAddress = a;
                            break;
                        }
                    }
                }
                if (matchedAddress) {
                    if (update.label && update.label === 'DEL') {
                        matchedAddress.label = null;
                    } else if (update.label) {
                        matchedAddress.label = update.label;
                    }
                    if (update.privkey && update.privkey === 'DEL') {
                        matchedAddress.privkey = null;
                    } else if (update.privkey) {
                        matchedAddress.privkey = update.privkey;
                    }
                    if (update.submitted && update.submitted === 'DEL') {
                        delete matchedAddress.submitted;
                    } else if (update.submitted) {
                        matchedAddress.submitted = update.submitted;
                    }
                    if (update.label || update.privkey || update.address) {
                        this._saveWallet();
                        this._loadActiveAddresses().then(() => {
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                } else {
                    resolve();
                }
            } else {
                resolve();
            }
        });
    }

    _initWallet(wallet, password) {
        wallet.ts = Math.floor(Date.now() / 1000);
        wallet.id = CONSTANTS.WALLET_ID_PREFIX + CONSTANTS.WALLET_ID_DELIMETER + window.crypto.getRandomValues(new Uint32Array(1))[0] + CONSTANTS.WALLET_ID_DELIMETER + wallet.ts;
        wallet.addresses[0].isactive = true;
        wallet.addresses[0].isprimary = true;
        wallet.addresses[1].isactive = true;
        if (wallet.id && wallet.id.startsWith(CONSTANTS.WALLET_ID_PREFIX + CONSTANTS.WALLET_ID_DELIMETER) && wallet.id.length > 12) {
            this.wallet = wallet;
            this.passwd = password;
            this._saveWallet(password);
        } else {
            throw new Error('Wallet ID not valid.');
        }
    }

    initWallet(wallet, password, initType) {
        return new Promise((resolve, reject) => {
            this._initWallet(wallet, password);
            this.walletApi.getSessionToken(wallet.id).then((token) => {
                let rescan = (initType && initType === 'recover_wallet') ? true : false;
                return this._loadActiveAddresses(rescan).then(() => {
                    resolve();
                });
            }).catch(error => {
                reject(this._sanitizeError(error));
            });
        });
    }

    initAndNavigateToWallet(wallet, password, initType) {
        let progress = UI.progress.startWithLoader(6000);
        return new Promise((resolve, reject) => {
            this.router.navigate('/', { replace: true, trigger: false });
            this.router.reset();
            this.router.deactivate();
            this.aurelia.setRoot(PLATFORM.moduleName('wallet'));
            document.body.className = "wallet-app";
            return this.initWallet(wallet, password, initType).then(() => {
                progress.end();
                resolve();
            }).catch(error => {
                progress.end();
                this.showNotification(this._sanitizeError(error).message, 'danger');
            });
        });
    }

    unlockWallet(password) {
        return new Promise((resolve, reject) => {
            let progress = UI.progress.start(3000);
            if (this._loadWallet(password)) {
                this.walletApi.getSessionToken(this.wallet.id).then((token) => {
                    return this._loadActiveAddresses().then(() => {
                        this.router.navigate('/', { replace: true, trigger: false });
                        this.router.reset();
                        this.router.deactivate();
                        this.aurelia.setRoot(PLATFORM.moduleName('wallet'));
                        document.body.className = "wallet-app";
                        progress.end();
                        resolve();
                    });
                }).catch(error => {
                    progress.end();
                    reject(this._sanitizeError(error));
                });
            } else {
                progress.end();
                reject(this._sanitizeError('Wallet decryption failed'));
            }
        });
    }

    navigateToUnlockScreen() {
        this.router.navigate('/', { replace: true, trigger: false });
        this.router.reset();
        this.router.deactivate();
        this.aurelia.setRoot(PLATFORM.moduleName('wallet-unlock'));
        document.body.className = "wallet-unlock";
    }

    getWallet() {
        return this.wallet;
    }

    getAllWalletData() {
        let ts = Date.now();
        let wallet = this.getWallet();
        let transactions = this.getTxHistory();
        let preferences = this.getPreferences();
        let addressBook = this.getAddressBook();
        return {
            date: ts,
            wallet: wallet,
            transactions: transactions,
            preferences: preferences,
            addressBook: addressBook
        }
    }

    getAllWalletDataJsonified() {
        return JSON.stringify(this.getAllWalletData());
    }

    getAllWalletDataEncrypted() {
        try {
            let encrypted = AES.encrypt(this.getAllWalletDataJsonified(), this.passwd).toString();
            return JSON.stringify({ "data": encrypted });
        } catch (e) {
            throw new Error('Encryption of wallet data failed');
        }
    }

    decryptWalletData(data) {
        let decrypted = JSON.parse(AES.decrypt(data, this.passwd).toString(ENC_UTF8));
        return decrypted;
    }

    getWalletId() {
        return this.wallet.id;
    }

    getWalletTs() {
        return this.wallet.ts;
    }

    getPrimaryAddress() {
        return this.wallet.addresses[0];
    }

    get currentActiveInternalAddressCount() {
        let count = 0;
        if (!this.active) {
            return count;
        }
        for (let address of this.active.addresses) {
            if (!address.isexternal) {
                count++;
            }
        }
        return count;
    }

    get currentImportedAddressCount() {
        let count = 0;
        if (!this.active) {
            return count;
        }
        for (let address of this.active.addresses) {
            if (address.isexternal) {
                count++;
            }
        }
        return count;
    }

    activateAnyAvailableAddress() {
        return new Promise((resolve, reject) => {
            let index = this._getAvailableAddressIndex();
            if (index) {
                this.wallet.addresses[index].isactive = true;
                this._saveWallet();
                this._loadActiveAddresses().then(() => {
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    _getAvailableAddressIndex(count) {
        if (!count) {
            count = 1;
        }
        let index = lang.getRandomInt(1, CONSTANTS.MAX_INTERNAL_ADDRESSES-1);
        if (this._isAddressIndexCurrentlyActive(index)) {
            count++;
            if (count > 100) {
                return null;
            } else {
                return this._getAvailableAddressIndex(count);
            }
        } else {
            return index;
        }
    }

    _isAddressIndexCurrentlyActive(index) {
        return ((this.wallet.addresses[index] && this.wallet.addresses[index].isactive === true)) ? true : false;
    }

    getAllAddresses() {
        return new Promise((resolve, reject) => {
            let addresses = [];
            for (let address of this.wallet.addresses) {
                if (address.index === 0) {
                    address.isprimary = true;
                }
                addresses.push(address);
            }
            if (this.wallet.ext) {
                let keys = Object.keys(this.wallet.ext);
                if (keys.length > 0) {
                    for (let key of keys) {
                        let address = this.wallet.ext[key];
                        address.isexternal = true;
                        addresses.push(address);
                    }
                }
            }
            return resolve(addresses);
        });
    }

    broadCastTransaction(txid, transaction) {
        return new Promise((resolve, reject) => {
            this.walletApi.broadcastTx(transaction.hex).then(confirmedTxId => {
                let txHist = {
                    date: Math.floor(Date.now() / 1000),
                    txid: transaction.txid,
                    payAddress: transaction.payAddress,
                    payAmount: transaction.totals.payAmount.value,
                    changeAmount: transaction.totals.changeAmount.value,
                    changeAddress: transaction.changeAddress,
                    inputs: transaction.inputs
                }
                return this.addToTxHistory(txHist).then(() => {
                    resolve(confirmedTxId);
                });
            }).catch(error => {
                reject(this._sanitizeError(error));
            });
        });
    }


    _loadTxHistory() {
        let h = localStorage.getItem('txhist') || null;
        if (h && h !== 'null') {
            this.txHistory = JSON.parse(h);
            if (!lang.isArray(this.txHistory)) {
                this.txHistory = [];
            }
        } else {
            this.txHistory = [];
        }
    }

    _saveTxHistory() {
        localStorage['txhist'] = JSON.stringify(this.txHistory);
    }

    getTxHistory() {
        if (!this.txHistory) {
            this._loadTxHistory();
        }
        return this.txHistory;
    }

    addToTxHistory(tx) {
        return new Promise((resolve, reject) => {
            if (!this.txHistory) {
                this._loadTxHistory();
            }
            this.txHistory.unshift(tx);
            if (this.txHistory.length >= CONSTANTS.MAX_PAY_HISTORY) {
                this.txHistory = this.txHistory.slice(0, CONSTANTS.MAX_PAY_HISTORY);
            }
            this._saveTxHistory();
            this._loadTxHistory();
            resolve();
        });
    }

    _loadAddressBook() {
        let b = localStorage.getItem('abook') || null;
        if (b && b !== 'null') {
            this.addressBook = JSON.parse(b);
            if (!lang.isArray(this.addressBook)) {
                this.addressBook = [];
            }
        } else {
            this.addressBook = [];
        }
    }

    _saveAddressBook() {
        localStorage['abook'] = JSON.stringify(this.addressBook);
    }

    _existsInAddressBook(address) {
        let addressExists = false;
        for (let a of this.addressBook) {
            if (a.address === address) {
                addressExists = true;
                break;
            }
        }
        return addressExists;
    }

    getAddressBook() {
        if (!this.addressBook) {
            this._loadAddressBook();
        }
        return this.addressBook;
    }

    addToAddressBook(address, label) {
        return new Promise((resolve, reject) => {
            if (!this.addressBook) {
                this._loadAddressBook();
            }
            if (this.addressBook.length >= CONSTANTS.MAX_ADDRESS_BOOK_ENTRIES) {
                return reject(this._sanitizeError('Address book size limit reached'));
            }
            if (this._existsInAddressBook(address)) {
                return reject(this._sanitizeError('Address already exists'));
            }
            this.walletApi.getAddressInfo(address).then(addressInfo => {
                if (!addressInfo) {
                    reject(this._sanitizeError('Failed to validate address'));
                } else if (!addressInfo.isvalid) {
                    reject(this._sanitizeError('Invalid address'));
                } else {
                    this.addressBook.push({
                        address: address,
                        label: (label && label != "") ? label : undefined
                    });
                    this._saveAddressBook();
                    this._loadAddressBook();
                    resolve();
                }
            }).catch(error => {
                reject(this._sanitizeError(error));
            });
        });
    }

    removeFromAddressBook(address) {
        return new Promise((resolve, reject) => {
            if (address) {
                let updatedAddressList = [];
                for (let a of this.addressBook) {
                    if (a.address !== address) {
                        updatedAddressList.push(a);
                    }
                }
                this.addressBook = updatedAddressList;
                this._saveAddressBook();
                this._loadAddressBook();
                resolve();
            } else {
                resolve();
            }
        });
    }

    updateAddressBook(address, update) {
        return new Promise((resolve, reject) => {
            if (address && update) {
                let addressChanged = (update.address && update.address !== address) ? true : false;
                let updatedAddressList = [];
                for (let a of this.addressBook) {
                    if (a.address === address) {
                        if (addressChanged) {
                            a.address = update.address;
                        }
                        if (update.label && update.label === 'DEL') {
                            a.label = null;
                        } else if (update.label) {
                            a.label = update.label;
                        }
                        updatedAddressList.push(a);
                    } else {
                        updatedAddressList.push(a);
                    }
                }
                this.addressBook = updatedAddressList;
                this._saveAddressBook();
                this._loadAddressBook();
                resolve();
            } else {
                resolve();
            }
        });
    }

    _loadPreferences() {
        let p = localStorage.getItem('prefs') || null;
        if (p && p !== 'null') {
            this._preferences = JSON.parse(p);
            if (!this._preferences) {
                this._preferences = {
                    displayAdvancedTxDetails: 'true',
                    returnChangeTo: 'pay_address',
                    utxoSelectionStrategy: 'smallest_first',
                    lockMasternodeFunds: 'true'
                };
            }
        } else {
            this._preferences = {
                displayAdvancedTxDetails: 'true',
                returnChangeTo: 'pay_address',
                utxoSelectionStrategy: 'smallest_first',
                lockMasternodeFunds: 'true'
            };
        }
    }

    savePreferences(preferences) {
        if (preferences) {
            this._preferences = preferences;
        }
        localStorage['prefs'] = JSON.stringify(this._preferences);
    }

    getPreferences() {
        if (!this._preferences) {
            this._loadPreferences();
        }
        return this._preferences;
    }

}

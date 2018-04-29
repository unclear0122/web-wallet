
import { EventAggregator } from 'aurelia-event-aggregator';

import { WalletManager } from '../lib/wallet-manager';
import { isObject } from '../lib/lang';
import { Decimal } from 'decimal.js';

import * as walletLib from '../lib/wallet-lib';
import * as lang from '../lib/lang.js';


export class ModalPay {

    static inject() { return [EventAggregator, WalletManager]; }

    constructor(eventAggregator, walletManager) {

        this.eventAggregator = eventAggregator;
        this.walletManager = walletManager;

        this.mySpendableAddresses = [];
        this.myChangeAddresses = [];

        this.selectedPayFromAddresses = [];

        this.selectedPayToAddress = undefined;
        this.payAmount = undefined;
        this.txFee = new Decimal(0.01);
        this.tx = undefined;

        this.selectedChangeAddress = undefined;
        this.changeAddressManuallySelected = false;

        this.mySpendableAddressesRefreshed = 0;
        this.addressesBookRefreshed = 0;

        this.selectedPayFromAddressesSpendableBalance = 0;
        this.selectedPayFromAddressesSpendableBalanceInfo = null;

        this.isValidPayAmount = false;
        this.isValidPayToAddress = false;
        this.isPaymentCovered = false;
        this.paymentNotCoveredDetails = undefined;
        this.allPaymentCriteriaMet = false;

        this.addressBook = undefined;
        this.selectedAddressBookItem = undefined;

        this.modal = null;

        this.tabData = [
            {id: 'addressesTab', label: 'Addresses', active: true },
            {id: 'paymentDetailsTab', label: 'Payment Details', active: false },
        ];

        this.tabOptions = {
            'wizardMode': false,
            'isSelfControlled': false,
            'tabIdField': 'id',
            'tabLabelField': 'label',
            'tabActiveField': 'active',
            'tabContentField': 'content'
        };

        this.tableProperties = {
            tableName: 'my_addresses',
            enableSelection: true,
            itemKey: 'address',
            multiSelect: true,
            multiSelectScope: 'object',
            showHover: true,
            showBorder: false,
            small: true,
            paginator: { enabled: false },
            columns: [{
                'field': 'label',
                'label': 'Label'
            },{
                'field': 'address',
                'label': 'Address',
                'style': 'td-link',
                'trigger': { 'select': true },
            },{
                'field': 'balance.spendable',
                'label': 'Amount',
                'converter': { 'type': 'number', 'format': 'balance' }
            }]
        };

        this.addrBookTableProperties = {
            tableName: 'ab_addresses',
            enableSelection: true,
            itemKey: 'address',
            multiSelect: false,
            showHover: true,
            showBorder: false,
            small: true,
            paginator: { enabled: false },
            columns: [{
                'field': 'label',
                'label': 'Label'
            },{
                'field': 'address',
                'label': 'Address',
                'style': 'td-link',
                'trigger': { 'select': true }
            }]
        };

    }

    _clearPayState() {

        this.mySpendableAddresses = [];
        this.myChangeAddresses = [];
        this.selectedPayFromAddresses = [];
        this.selectedPayToAddress = null;
        this.selectedAddressBookItem = null;

        this.selectedPayToAddress = undefined;
        this.payAmount = undefined;
        this.tx = undefined;

        this.selectedChangeAddress = undefined;
        this.changeAddressManuallySelected = false;

        this.selectedPayFromAddressesSpendableBalance = 0;
        this.selectedPayFromAddressesSpendableBalanceInfo = null;

        this.isValidPayAmount = false;
        this.isValidPayToAddress = false;
        this.isPaymentCovered = false;
        this.paymentNotCoveredDetails = undefined;
        this.allPaymentCriteriaMet = false;

    }

    activate(model) {

        $('.carousel').carousel(0);

        this._clearPayState();

        this.prefs = this.walletManager.getPreferences();
        let lockMasternodeFunds = (this.prefs && this.prefs.hasOwnProperty('lockMasternodeFunds') && (this.prefs.lockMasternodeFunds === 'false' || this.prefs.lockMasternodeFunds === false)) ? false : true;
        this.lockTxAmount = lockMasternodeFunds ? this.walletManager.CONST.MASTERNODE_AMOUNT : 0;

        this.walletManager.getActiveAddresses().then(active => {

            if (active) {
                this._assignAdditionalState(active.addresses);
                this.myChangeAddresses = active.addresses;
                for (let address of active.addresses) {
                    if (address.privkey && address.balance && address.balance.spendable && address.balance.spendable > 0) {
                        this.mySpendableAddresses.push(address);
                    }
                }
            }

            if (model && model.data) {
                if (model.data.selectedAddresses && model.data.selectedAddresses.length > 0) {
                    let selectedAddressType = (model.data.selectedAddressType) ? model.data.selectedAddressType : 'payFrom';
                    if (selectedAddressType === 'payTo') {
                        this.selectedAddressBookItem = model.data.selectedAddresses[0];
                        this.addressBookItemSelected();
                    } else {
                        for (let address of model.data.selectedAddresses) {
                            if (address.privkey && address.balance && address.balance.spendable && address.balance.spendable > 0) {
                                this.selectedPayFromAddresses.push(address);
                            }
                        }
                    }

                }
            }
            if (model && model.modal) {
                this.modal = model.modal;
            }
            this.pickChangeAddress();
            this.calculateTotalAvailableBalanceFromSelectedAddresses();
            this.addressBook = this.walletManager.getAddressBook();

        }).catch(error => {
            console.log(error);
        });

    }

    _assignAdditionalState(addresses, selectedAddresses) {
        for (let address of addresses) {
            if (address.label) {
                address.labelledAddress = address.address + ' - ' + address.label;
            } else {
                address.labelledAddress = address.address;
            }
        }
    }

    attached() {
        this.mySpendableAddressesRefreshed = this.mySpendableAddressesRefreshed + 1;
        this.addressesBookRefreshed = this.addressesBookRefreshed + 1;
        $(document).ready(function () {
            $('.carousel').carousel({
                interval: false,
                keyboard: false,
                ride: false,
                wrap: false
            });
        });
    }

    get isPayFromAddressSelected() {
        return (this.selectedPayFromAddresses && this.selectedPayFromAddresses.length > 0) ? true : false;
    }

    payFromAddressSelected() {
        let that = this;
        setTimeout(function () {
            that.pickChangeAddress();
            that.calculateTotalAvailableBalanceFromSelectedAddresses();
            that.validatePayAmount();
        }, 50);
    }

    pickChangeAddress() {
        if (!this.changeAddressManuallySelected) {
            if (this.prefs && this.prefs.hasOwnProperty('returnChangeTo') && this.prefs.returnChangeTo === 'primary_address') {
                for (let address of this.mySpendableAddresses) {
                    if (address.isprimary) {
                        this.selectedChangeAddress = address;
                    }
                }
            } else if (this.selectedPayFromAddresses.length > 0) {
                this.selectedChangeAddress = this.selectedPayFromAddresses[0];
            } else {
                this.selectedChangeAddress = this.mySpendableAddresses[0];
            }
        }
        if (!this.selectedChangeAddress) {
            this.selectedChangeAddress = this.mySpendableAddresses[0];
        }
    }

    addressBookItemSelected() {
        let that = this;
        this.selectedPayToAddress = null;
        setTimeout(function () {
            if (that.selectedAddressBookItem && that.selectedAddressBookItem.address) {
                that.selectedPayToAddress = that.selectedAddressBookItem.address;
                that.validatePayToAddress();
            }
        }, 100);
    }

    changeAddressSelected() {
        let that = this;
        setTimeout(function () {
            that.changeAddressManuallySelected = true;
        }, 50);
    }

    calculateTotalAvailableBalanceFromSelectedAddresses() {
        this.selectedPayFromAddressesSpendableBalance = 0;
        this.selectedPayFromAddressesSpendableBalanceInfo = null;
        let multipleAddressesSelected = (this.selectedPayFromAddresses && this.selectedPayFromAddresses.length > 1) ? true: false;
        if (!multipleAddressesSelected && this.selectedPayFromAddresses && this.selectedPayFromAddresses.length === 1) {
            this.selectedPayFromAddressesSpendableBalanceInfo = 'from ' + this.selectedPayFromAddresses[0].address;
            if (this.selectedPayFromAddresses[0].label) {
                this.selectedPayFromAddressesSpendableBalanceInfo = this.selectedPayFromAddressesSpendableBalanceInfo + ' (' + this.selectedPayFromAddresses[0].label + ')'
            }
        } else if (multipleAddressesSelected) {
            this.selectedPayFromAddressesSpendableBalanceInfo = 'from multiple addresses';
        } else {
            this.selectedPayFromAddressesSpendableBalanceInfo = 'no spendable addresses selected';
        }
        for (let address of this.selectedPayFromAddresses) {
            if (address.privkey && address.utxos && address.balance) {
                this.selectedPayFromAddressesSpendableBalance = this.selectedPayFromAddressesSpendableBalance + address.balance.spendable;
            }
        }
        this.calculateIfSpendableBalanceIsEnough();
        this.validateAllPaymentCriteriaMet();
    }

    calculateIfSpendableBalanceIsEnough() {
        if (!this.payAmount) {
            this.isPaymentCovered = false;
            this.paymentNotCoveredDetails = null;
        } else if (this.payAmount === 0 || this.payAmount === "0" || !lang.isNumberLike(this.payAmount)) {
            this.isPaymentCovered = false;
            this.paymentNotCoveredDetails = null;
        } else {
            this.txFee = new Decimal(walletLib.estimateTxFee(this.payAmount, this.selectedPayFromAddresses, this.lockTxAmount, this.walletManager.CONST.MIN_TX_CONFIRMATIONS));
            let payAmount = new Decimal(this.payAmount-0);
            let payAmountInclFees = payAmount.plus(this.txFee);
            let availableBalance = new Decimal(this.selectedPayFromAddressesSpendableBalance);
            if (availableBalance.greaterThanOrEqualTo(payAmountInclFees)) {
                this.isPaymentCovered = true;
                this.paymentNotCoveredDetails = null;
            } else {
                if (availableBalance.greaterThanOrEqualTo(payAmount)) {
                    this.isPaymentCovered = false;
                    this.paymentNotCoveredDetails = 'FEES_NOT_COVERED';
                } else {
                    this.isPaymentCovered = false;
                    this.paymentNotCoveredDetails = null;
                }
            }
        }
    }

    validatePayAmount() {
        if (this.payAmount && lang.isNumberLike(this.payAmount) && ((this.payAmount-0) > 0)) {
            this.calculateIfSpendableBalanceIsEnough();
            if (this.isPaymentCovered) {
                this.isValidPayAmount = true;
                this.error = null;
            } else {
                this.isValidPayAmount = false;
                if (this.paymentNotCoveredDetails && this.paymentNotCoveredDetails === 'FEES_NOT_COVERED') {
                    this.error = 'There is not enough available balance left for tx fee';
                } else {
                    this.error = 'There is not enough available balance to cover the payment';
                }
            }
        } else {
            this.isPaymentCovered = false;
            this.paymentNotCoveredDetails = null;
            this.isValidPayAmount = false;
            this.error = null;
        }
        this.validateAllPaymentCriteriaMet();
    }

    validatePayToAddress() {
        if (!this.selectedPayToAddress) {
            this.isValidPayToAddress = false;
        } else {
            // if a pay address is entered manually and one is already selected from the address book, then clear the address book selection
            if (this.selectedPayToAddress && this.selectedAddressBookItem && (this.selectedAddressBookItem.address !== this.selectedPayToAddress)) {
                this.selectedAddressBookItem = null;
            }
            if (this.selectedPayToAddress.length > 32) {
                this.isValidPayToAddress = this.selectedPayToAddress.startsWith('B') ? true : false;
                if (!this.isValidPayToAddress) {
                    this.error = 'Invalid Beetle Address';
                } else {
                    if (walletLib.isValidAddress(this.selectedPayToAddress)) {
                        this.isValidPayToAddress = true;
                        this.error = null;
                    } else {
                        this.isValidPayToAddress = false;
                        this.error = 'Invalid Beetle Address';
                    }
                }
            } else {
                this.isValidPayToAddress = false;
            }
        }
        this.validateAllPaymentCriteriaMet();
    }

    validateAllPaymentCriteriaMet() {
        let addressConflict = false;
        if (this.isPayFromAddressSelected && this.isValidPayToAddress) {
            for (let address of this.selectedPayFromAddresses) {
                if (address.address === this.selectedPayToAddress) {
                    addressConflict = true;
                }
            }
        }
        if (addressConflict) {
            this.error = 'Cannot pay from address to same address';
            this.allPaymentCriteriaMet = false;
        } else {
            if (this.isPayFromAddressSelected && this.isValidPayToAddress && this.isValidPayAmount && this.isPaymentCovered) {
                this.allPaymentCriteriaMet = true;
            } else {
                this.allPaymentCriteriaMet = false;
            }
        }
        if (this.modal) {
            if (this.allPaymentCriteriaMet) {
                this.modal.confirm.disabled = false;
            } else {
                this.modal.confirm.disabled = true;
            }
        }
    }

    spendAllFundsFromSelectedAddresses() {
        if (this.selectedPayFromAddressesSpendableBalance) {
            let spendableAmount = new Decimal(this.selectedPayFromAddressesSpendableBalance-0);
            this.txFee = walletLib.estimateTxFee(spendableAmount.minus(this.txFee.toNumber()), this.selectedPayFromAddresses, this.lockTxAmount, this.walletManager.CONST.MIN_TX_CONFIRMATIONS);
            this.payAmount = spendableAmount.minus(this.txFee).toNumber();
            this.validatePayAmount();
        }
    }

    get displayAdvancedTxInfo() {
        return (this.prefs && this.prefs.hasOwnProperty('displayAdvancedTxDetails') && (this.prefs.displayAdvancedTxDetails === 'true' || this.prefs.displayAdvancedTxDetails === true)) ? true : false;
    }

    confirmTransaction() {
        this.validateAllPaymentCriteriaMet();
        if (this.allPaymentCriteriaMet) {
            try {
                this.tx = walletLib.createSignedTransaction(this.payAmount, this.selectedPayToAddress, this.selectedPayFromAddresses, this.selectedChangeAddress.address, this.lockTxAmount, this.walletManager.CONST.MIN_TX_CONFIRMATIONS);
                this._goToPaymentConfirmationScreen();
            } catch (e) {
                console.log('Failed to generate tx');
                console.log(e);
            }
        }
    }

    sendTransaction() {
        if (this.allPaymentCriteriaMet && this.tx && this.tx.txid && this.tx.hex) {
            this.walletManager.broadCastTransaction(this.tx.txid, this.tx).then(txId => {
                this.confirmedTxId = txId;
                this.walletManager.updateBalances().then(() => {
                    this.eventAggregator.publish('tx-sent', { status: 'success' });
                    this._goToPaymentDetailsScreen();
                });
            }).catch(error => {
                console.log('Payment error');
                console.log(error);
                this.txError = error.message;
                this._goToPaymentDetailsScreen();
            });
        }
    }

    _goToPaymentCaptureScreen() {
        $('.carousel').carousel(0);
        this.modal.confirm.text = 'Confirm';
        this.modal.confirm.call = 'confirmTransaction';
        this.modal.cancel.text = 'Cancel';
        this.modal.cancel.call = 'closeSendModal';
    }

    _goToPaymentConfirmationScreen() {
        $('.carousel').carousel(1);
        this.modal.confirm.text = 'Pay';
        this.modal.confirm.call = 'sendTransaction';
        this.modal.cancel.text = 'Cancel';
        this.modal.cancel.call = '_goToPaymentCaptureScreen';
    }

    _goToPaymentDetailsScreen() {
        $('.carousel').carousel(2);
        this.modal.cancel.text = 'Close';
        this.modal.cancel.call = 'closeSendModal';
        this.modal.confirm.show = false;
    }

}






import { EventAggregator } from 'aurelia-event-aggregator';

import { ModalService } from '../components/modal-service';
import { WalletManager } from '../lib/wallet-manager';
import { UI } from '../lib/ui-assist';

import * as lang from '../lib/lang.js';

import * as QRious from 'qrious';
import * as Tipped from 'tipped/tipped.js';


export class Balance {

    static inject() { return [EventAggregator,WalletManager,ModalService]; }

    constructor(eventAggregator, walletManager, modalService) {

        this.eventAggregator = eventAggregator;
        this.walletManager = walletManager;
        this.modalService = modalService;

        this.totalBalance = 0;
        this.totalSpendableBalance = 0;
        this.unfilteredAddresses = [];
        this.filteredAddresses = [];
        this.selectedAddress = undefined;
        this.selectedAddresses = [];
        this.addressDataRefreshed = 0;
        this.qrAddress = undefined;

        this.tableProperties = {
            tableName: 'addresses',
            itemKey: 'address',
            enableSelection: true,
            multiSelect: true,
            multiSelectScope: 'object',
            showHover: true,
            showBorder: false,
            paginator: {
                enabled: false,
                pageSize: 10,
                type: 'dataProvided', // dataProvided || dataFetched
                //fetchData: 'fetchAddresses',
            },
            columns: [{
                'field': 'label',
                'label': 'Label'
            },{
                'field': 'address',
                'label': 'Address',
                'style': 'td-link',
                'trigger': { 'select': true }
                //'trigger': { 'event': 'address-href-clicked' },
                //'route': { 'to': 'assessment-detail', 'id': '_key' },
            },{
                'field': 'isexternal',
                'label': 'External',
                'class': 'text-center',
                'converter': { 'type': 'boolean', 'format': 'Yes,No' }
            },{
                'field': 'privkey',
                'label': 'Spendable',
                'class': 'text-center',
                'converter': { 'type': 'boolean', 'format': 'Yes,No' }
            //},{
            //    'field': 'submitted',
            //    'label': 'Synced',
            //    'class': 'text-center',
            //    'converter': { 'type': 'boolean', 'format': 'No,Yes' }
            },{
                'field': 'balance.amount',
                'label': 'Balance',
                'class': 'text-right',
                'converter': { 'type': 'number', 'format': 'balance' }
            }]
        };

        this.receiveModal = {
            renderModalButtons: true,
            confirm: {
                text: 'Close',
                class: 'btn-dark',
                call: 'closeReceiveModal'
            }
        }

        this.sendModal = {
            viewModel: PLATFORM.moduleName('views/modal-pay'),
            renderModalButtons: true,
            confirm: {
                text: 'Confirm',
                class: 'btn-secondary',
                call: 'confirmTransaction',
                disabled: true
            },
            cancel: {
                text: 'Cancel',
                class: 'btn-dark',
                call: 'closeSendModal'
            }
        }

        this.importAddressModal = {
            viewModel: PLATFORM.moduleName('views/modal-import-address'),
            renderModalButtons: true,
            confirm: {
                text: 'Import',
                class: 'btn-secondary',
                call: 'importExternalAddress',
                disabled: true
            },
            cancel: {
                text: 'Cancel',
                class: 'btn-dark',
                call: 'closeImportAddressModal'
            }
        }

        this.manageAddressModal = {
            viewModel: PLATFORM.moduleName('views/modal-manage-address'),
            renderModalButtons: true,
            confirm: {
                text: 'Save',
                class: 'btn-secondary',
                call: 'updateAddress',
                disabled: true
            },
            cancel: {
                text: 'Cancel',
                class: 'btn-dark',
                call: 'closeManageAddressModal'
            },
            deny: {
                text: 'Remove',
                class: 'btn-danger',
                call: 'removeAddress',
                //show: false
            }
        }

        this.eventAggregator.subscribe('address-imported', eventMessage => {
            this.closeImportAddressModal();
        });

        this.eventAggregator.subscribe('address-updated', eventMessage => {
            this.closeManageAddressModal();
        });

        this.eventAggregator.subscribe('address-href-clicked', address => {
            this.openReceiveModal(address);
        });

        this.eventAggregator.subscribe('active-state-updated', eventMessage => {
            //UI.log.info('Active state updated. Refreshing balance UI.');
            this.updateView();
        });

        //this.eventAggregator.subscribe('tx-sent', result => {
        //});

    }

    //bind(bindingContext) {
    //    this.parent = bindingContext;
    //}

    attached() {
        this.walletManager.dismissNotification();
        if (!this.walletManager.isUpdatingActiveAddresses) {
            this.updateBalances();
        }
        $(document).ready(function () {
            Tipped.create('#balance_screen_help', {
                inline: 'balance_screen_help_content',
                radius: false,
                padding: false,
                position: 'left',
                maxWidth: 720
            });
        });
    }

    get isAnyAddressSelected() {
        if (this.tableProperties.multiSelect === true) {
            return (this.selectedAddresses && this.selectedAddresses.length > 0) ? true : false;
        } else {
            return this.selectedAddress ? true : false;
        }
    }

    get isExactlyOneAddressSelected() {
        if (this.tableProperties.multiSelect === true) {
            return (this.selectedAddresses && this.selectedAddresses.length === 1) ? true : false;
        } else {
            return this.selectedAddress ? true : false;
        }
    }

    get isMultipleAddressesSelected() {
        if (this.tableProperties.multiSelect === true) {
            return (this.selectedAddresses && this.selectedAddresses.length > 1) ? true : false;
        } else {
            return false;
        }
    }

    get isExactlyOneNonPrimaryAddressSelected() {
        if (this.isExactlyOneAddressSelected) {
            if (this.tableProperties.multiSelect === true) {
                return (this.selectedAddresses[0].isprimary !== true) ? true : false;
            } else {
                return this.selectedAddress.isprimary !== true ? true : false;
            }
        } else {
            return false;
        }
    }

    get isExactlyOneImportedAddressSelected() {
        if (this.isExactlyOneAddressSelected) {
            if (this.tableProperties.multiSelect === true) {
                return (this.selectedAddresses[0].isexternal === true) ? true : false;
            } else {
                return this.selectedAddress.isexternal === true ? true : false;
            }
        } else {
            return false;
        }
    }

    addressSelected() {}

    updateBalances() {
        this.walletManager.updateBalances();
    }

    updateView() {
        let previouslySelectedAddresses = this.selectedAddresses;
        this.selectedAddresses = [];
        this.walletManager.getActiveAddresses().then(active => {
            if (active) {
                this.totalBalance = active.totalBalance;
                this.totalSpendableBalance = active.spendableBalance;
                this.unfilteredAddresses = active.addresses;
                this.filteredAddresses = active.addresses;
                this.addressDataRefreshed = this.addressDataRefreshed+1;
            }
        }).catch(error => {
            console.log(error);
        });
    }

    openReceiveModal(address) {
        if (address) {
            this.qrAddress = address.address;
        } else if (this.selectedAddress) {
            this.qrAddress = this.selectedAddress.address;
        } else if (this.isExactlyOneAddressSelected) {
            this.qrAddress = this.selectedAddresses[0].address;
        } else {
            this.qrAddress = this.walletManager.getPrimaryAddress().address;
        }
        if (this.qrAddress) {
            let qr = new QRious({
                element: document.getElementById('qr'),
                value: this.qrAddress,
                level: 'Q',
                padding: 40,
                size: 280
            });
            this.modalService.getModal('qrModal').open(this.receiveModal, 'Receive');
        } else {
            console.log('No address selected ?');
        }
    }

    closeReceiveModal() {
        this.qrAddress = null;
        this.modalService.getModal('qrModal').close();
    }

    openSendModal() {
        if (this.selectedAddress && (!this.selectedAddresses || (this.selectedAddresses.length === 0))) {
            this.modalService.getModal('genericModal').open(this.sendModal, 'Pay', { selectedAddresses: [ this.selectedAddress ]  });
        } else if (this.selectedAddresses && this.selectedAddresses.length > 0) {
            this.modalService.getModal('genericModal').open(this.sendModal, 'Pay', { selectedAddresses: this.selectedAddresses });
        } else {
            this.modalService.getModal('genericModal').open(this.sendModal, 'Pay', { selectedAddresses: null });
        }
    }

    closeSendModal() {
        this.selectedAddress = null;
        this.modalService.getModal('genericModal').close();
    }

    get mayImportAddresses() {
        return (this.walletManager.currentImportedAddressCount >= this.walletManager.CONST.MAX_IMPORTED_ADDRESSES) ? false : true;
    }

    openImportAddressModal() {
        this.walletManager.showNotification('This feature has been temporarily disabled', 'info');
        //alert('This feature has been temporarily disabled');
    }

    openImportAddressModalDisabled() {
        if (!this.mayImportAddresses) {
            this.walletManager.showNotification('Max number of imported addresses (' + this.walletManager.CONST.MAX_IMPORTED_ADDRESSES + ') reached. This limit may be revised in the future.', 'danger');
        } else {
            this.modalService.getModal('genericModal').open(this.importAddressModal, 'Import external address', Date.now());
        }
    }

    closeImportAddressModal() {
        this.modalService.getModal('genericModal').close();
    }

    openManageAddressModal() {
        if (this.selectedAddress) {
            this.modalService.getModal('genericModal').open(this.manageAddressModal, 'Update address', this.selectedAddress);
        } else if (this.isExactlyOneAddressSelected) {
            this.modalService.getModal('genericModal').open(this.manageAddressModal, 'Update address', this.selectedAddresses[0]);
        } else {
            console.log('No address selected ?');
        }
    }

    closeManageAddressModal() {
        this.selectedAddress = null;
        this.modalService.getModal('genericModal').close();
    }

    get mayAddInternalAddresses() {
        return (this.walletManager.currentActiveInternalAddressCount >= this.walletManager.CONST.MAX_INTERNAL_ADDRESSES) ? false : true;
    }

    addAddress() {
        if (!this.mayAddInternalAddresses) {
            this.walletManager.showNotification('Max number of interal addresses (' + this.walletManager.CONST.MAX_INTERNAL_ADDRESSES + ') reached. This limit may be revised in the future.', 'danger');
        } else {
            this.walletManager.activateAnyAvailableAddress().then(() => {

            });
        }
    }

    removeAddress() {
        let address = undefined;
        if (this.selectedAddress) {
            address = this.selectedAddress.address;
        } else if (this.isExactlyOneAddressSelected) {
            address = this.selectedAddresses[0].address;
        }
        if (address) {
            if (confirm("Are you sure you want to remove this address?")) {
                this.walletManager.removeAddress(address).then(() => {
                    this.eventAggregator.publish('address-updated', { status: 'success' });
                });
            } else {
                this.eventAggregator.publish('address-updated', { status: 'success' });
            }
        }
    }

}





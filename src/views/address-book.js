
import { EventAggregator } from 'aurelia-event-aggregator';

import { ModalService } from '../components/modal-service';
import { WalletManager } from '../lib/wallet-manager';
import { UI } from '../lib/ui-assist';

import * as Tipped from 'tipped/tipped.js';


export class AddressBook {

    static inject() { return [EventAggregator,WalletManager,ModalService]; }

    constructor(eventAggregator, walletManager, modalService) {

        this.eventAggregator = eventAggregator;
        this.walletManager = walletManager;
        this.modalService = modalService;

        this.unfilteredAddresses = [];
        this.filteredAddresses = [];
        this.selectedAddress = undefined;
        this.addressDataRefreshed = 0;

        this.tableProperties = {
            tableName: 'addresses',
            itemKey: 'address',
            enableSelection: true,
            multiSelect: false,
            multiSelectScope: 'object',
            showHover: true,
            showBorder: false,
            paginator: {
                enabled: false,
                pageSize: 10,
                type: 'dataProvided', // dataProvided || dataFetched
                //fetchData: 'fetchUsers',
            },
            columns: [{
                'field': 'label',
                'label': 'Label'
            },{
                'field': 'address',
                'label': 'Address',
                'style': 'td-link',
                /* 'trigger': { 'event': 'address-href-clicked' }, */
                /* 'route': { 'to': 'assessment-detail', 'id': '_key' }, */
            }]
        };

        this.addAddressModal = {
            viewModel: PLATFORM.moduleName('views/modal-address-book-add'),
            renderModalButtons: true,
            confirm: {
                text: 'Add',
                class: 'btn-secondary',
                call: 'addAddress',
                disabled: true
            },
            cancel: {
                text: 'Cancel',
                class: 'btn-dark',
                call: 'closeAddAddressModal'
            }
        }

        this.manageAddressModal = {
            viewModel: PLATFORM.moduleName('views/modal-address-book-manage'),
            renderModalButtons: true,
            confirm: {
                text: 'Save',
                class: 'btn-secondary',
                call: 'updateAddress'
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
                show: false
            }
        }

        this.paymentModal = {
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

        this.eventAggregator.subscribe('address-book-added', eventMessage => {
            this.refreshAddressList();
            this.closeAddAddressModal();
        });

        this.eventAggregator.subscribe('address-book-updated', eventMessage => {
            this.refreshAddressList();
            this.closeManageAddressModal();
        });

        //this.eventAggregator.subscribe('address-href-clicked', address => {
        //    this.openReceiveModal(address);
        //});

    }

    //bind(bindingContext) {
    //    this.parent = bindingContext;
    //}

    attached() {
        this.walletManager.dismissNotification();
        this.refreshAddressList();
        $(document).ready(function () {
            Tipped.create('#ab_screen_help', {
                inline: 'ab_screen_help_content',
                radius: false,
                padding: false,
                position: 'left',
                maxWidth: 560
            });
        });
    }

    refreshAddressList() {
        this.unfilteredAddresses = null;
        this.filteredAddresses = null;
        let addressBook = this.walletManager.getAddressBook();
        this.unfilteredAddresses = addressBook;
        this.filteredAddresses = addressBook;
        this.addressDataRefreshed = this.addressDataRefreshed+1;
    }

    addressSelected() {}

    get mayAddToAddressBook() {
        return (this.unfilteredAddresses.length >= this.walletManager.CONST.MAX_ADDRESS_BOOK_ENTRIES) ? false : true;
    }

    openAddAddressModal() {
        if (!this.mayAddToAddressBook) {
            this.walletManager.showNotification('Max number of address book entries (' + this.walletManager.CONST.MAX_ADDRESS_BOOK_ENTRIES + ') reached. This limit may be revised in the future.', 'danger');
        } else {
            this.modalService.getModal('addressBookModal').open(this.addAddressModal, 'Add address', Date.now());
        }
    }

    closeAddAddressModal() {
        this.selectedAddress = null;
        this.modalService.getModal('addressBookModal').close();
    }

    openManageAddressModal() {
        if (this.selectedAddress) {
            this.modalService.getModal('addressBookModal').open(this.manageAddressModal, 'Update address', this.selectedAddress);
        } else {
            console.log('No address selected ?');
        }
    }

    closeManageAddressModal() {
        this.selectedAddress = null;
        this.modalService.getModal('addressBookModal').close();
    }

    removeAddress() {
        if (this.selectedAddress) {
            if (confirm("Are you sure you want to remove this address?")) {
                this.walletManager.removeFromAddressBook(this.selectedAddress.address).then(() => {
                    this.eventAggregator.publish('address-book-updated', { status: 'success' });
                });
            } else {
                this.eventAggregator.publish('address-book-updated', { status: 'success' });
            }
        }
    }

    openSendModal() {
        if (this.selectedAddress) {
            this.modalService.getModal('genericModal').open(this.paymentModal, 'Pay', { selectedAddresses: [ this.selectedAddress ], 'selectedAddressType': 'payTo'  });
        }
    }

    closeSendModal() {
        this.selectedAddress = null;
        this.modalService.getModal('genericModal').close();
    }

}





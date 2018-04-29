
import { EventAggregator } from 'aurelia-event-aggregator';

import { ModalService } from '../components/modal-service';
import { WalletManager } from '../lib/wallet-manager';
import { UI } from '../lib/ui-assist';

import * as lang from '../lib/lang.js';

import * as Tipped from 'tipped/tipped.js';



export class AddressBook {

    static inject() { return [EventAggregator,WalletManager,ModalService]; }

    constructor(eventAggregator, walletManager, modalService) {

        this.eventAggregator = eventAggregator;
        this.walletManager = walletManager;
        this.modalService = modalService;

        this.unfilteredTransactions = [];
        this.filteredTransactions = [];
        this.selectedTransaction = undefined;
        this.transactionDataRefreshed = 0;

        this.tableProperties = {
            tableName: 'transactions',
            itemKey: 'txid',
            enableSelection: false,
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
                'field': 'dateString',
                'label': 'Date',
            },{
                'field': 'payAddress',
                'label': 'Pay Address',
                'style': 'td-link',
                'trigger': { 'event': 'tx-clicked' },
            },{
                'field': 'payAmount',
                'label': 'Pay Amount',
                'converter': { 'type': 'number', 'format': 'balance' }
            }]
        };

        this.txDetailModal = {
            renderModalButtons: true,
            confirm: {
                text: 'Close',
                class: 'btn-dark',
                call: 'closeTxDetailModal'
            }
        }

        this.eventAggregator.subscribe('tx-clicked', tx => {
            this.selectedTransaction = tx;
            this.openTxDetailModal();
        });

    }

    attached() {
        this.walletManager.dismissNotification();
        this.refreshTxList();
        $(document).ready(function () {
            Tipped.create('#tx_screen_help', {
                inline: 'tx_screen_help_content',
                radius: false,
                padding: false,
                position: 'left',
                maxWidth: 560
            });
        });
    }

    _adjustForTimezone(date) {
        // offset = -(new Date().getTimezoneOffset() / 60);
        let timeOffsetInMS = date.getTimezoneOffset() * 60000;
        date.setTime(date.getTime() - timeOffsetInMS);
        return date;
    }

    refreshTxList() {
        this.unfilteredTransactions = null;
        this.filteredTransactions = null;
        let history = this.walletManager.getTxHistory();
        for (let tx of history) {
            if (tx.date) {
                tx.dateString = lang.toDateTime(tx.date, true);
            } else {
                tx.dateString = 'N/A';
            }
        }
        this.unfilteredTransactions = history;
        this.filteredTransactions = history;
        this.transactionDataRefreshed = this.transactionDataRefreshed+1;
    }

    transactionSelected() {}

    openTxDetailModal() {
        if (this.selectedTransaction) {
            this.modalService.getModal('txDetailModal').open(this.txDetailModal, 'Transaction Details', this.selectedTransaction);
        } else {
            console.log('No transaction selected ?');
        }
    }

    closeTxDetailModal() {
        this.selectedTransaction = null;
        this.modalService.getModal('txDetailModal').close();
    }

}





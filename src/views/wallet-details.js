


import { WalletManager } from '../lib/wallet-manager';
import { AureliaConfiguration } from 'aurelia-configuration';

export class WalletDetails {

    static inject() { return [WalletManager, AureliaConfiguration]; }

    constructor(walletManager, config) {

        this.walletManager = walletManager;
        this.config = config;

        this.wallet = undefined;
        this.version = this.config.get('version');

        this.tableProperties = {
            tableName: 'addresses',
            enableSelection: false,
            showHover: true,
            showBorder: false,
            paginator: {
                enabled: true,
                pageSize: 10,
                type: 'dataProvided', // dataProvided || dataFetched
                //fetchData: 'fetchUsers',
            },
            columns: [{
                'field': 'address',
                'label': 'Address'
            },{
                'field': 'privkey',
                'label': 'Private Key'
            }]
        };

    }

    //bind(bindingContext) {
    //    this.parent = bindingContext;
    //}

    attached() {
        this.wallet = this.walletManager.getWallet();
        //$(document).ready(function() {
        //    $('#bootstrap-data-table-export').DataTable();
        //});
    }

}

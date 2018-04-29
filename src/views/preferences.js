
import { WalletManager } from '../lib/wallet-manager';
import { UI } from '../lib/ui-assist';

import * as Tipped from 'tipped/tipped.js';

export class Preferences {

    static inject() { return [WalletManager]; }

    constructor(walletManager) {
        this.walletManager = walletManager;
        this.preferences = undefined;
    }

    attached() {
        this.loadPreferences();
        $(document).ready(function () {
            Tipped.create('#pref_lockmn_help', {
                inline: 'pref_lockmn_help_content',
                radius: false,
                padding: false,
                position: 'left',
                maxWidth: 560
            });
        });
        $(document).ready(function () {
            Tipped.create('#pref_txinfo_help', {
                inline: 'pref_txinfo_help_content',
                radius: false,
                padding: false,
                position: 'left',
                maxWidth: 560
            });
        });
        $(document).ready(function () {
            Tipped.create('#pref_change_help', {
                inline: 'pref_change_help_content',
                radius: false,
                padding: false,
                position: 'left',
                maxWidth: 560
            });
        });
        $(document).ready(function () {
            Tipped.create('#pref_utxo_help', {
                inline: 'pref_utxo_help_content',
                radius: false,
                padding: false,
                position: 'left',
                maxWidth: 560
            });
        });
    }

    loadPreferences() {
        this.preferences = this.walletManager.getPreferences();
    }

    savePreferences() {
        let progress = UI.progress.start(1000);
        this.walletManager.savePreferences(this.preferences);
        this.walletManager.updateBalances();
        progress.end();
    }

    deleteWallet() {
        this.walletManager.deleteWallet();
    }

    exportEncryptedWallet() {
        this.exportWallet(this.walletManager.getAllWalletDataEncrypted());
    }

    exportJsonWallet() {
        this.exportWallet(this.walletManager.getAllWalletDataJsonified());
    }

    exportWallet(data) {

        let ts = Math.floor(Date.now() / 1000);

        let blob = new Blob([data], {
            "type": "text/json;charset=utf8;"
        });

        let a = document.createElement('a');
        a.style = "display: none";
        a.href = window.URL.createObjectURL(blob);
        a.download = 'beetle-webwallet-' + ts + '.json';
        document.body.appendChild(a);
        a.click();

        setTimeout(function () {
            document.body.removeChild(a);
            //window.URL.revokeObjectURL(url);
        }, 50);

    }

    /*
    //let blob = this.base64toBlob(base64data);
    _base64toBlob(base64Data, contentType, sliceSize) {

        let byteCharacters;

        if (base64Data.startsWith('data')) {
            //base64Data = base64Data.substring(base64Data.indexOf(',') + 1);
            let tokens = base64Data.split(",");
            let prefix = tokens[0];
            contentType = contentType ? contentType : prefix.split(/[:;]+/)[1];
            byteCharacters = atob(tokens[1]);
        } else {
            contentType = contentType || '';
            byteCharacters = atob(base64Data);
        }

        let blobData = sliceSize ? getBlobDataSliced() : getBlobDataAtOnce();
        return new Blob(blobData, { type: contentType });

        // Get blob data in one slice.
        // => Fast in IE on new Blob(...)
        function getBlobDataAtOnce() {
            let byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            let byteArray = new Uint8Array(byteNumbers);
            return [byteArray];
        }

        // Get blob data in multiple slices.
        // => Slow in IE on new Blob(...)
        function getBlobDataSliced() {
            let slice, byteArrays = [];
            for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                slice = byteCharacters.slice(offset, offset + sliceSize);
                let byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                let byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }
            return byteArrays;
        }

    }
    */

}


import { PLATFORM } from 'aurelia-pal';
import { LogManager } from "aurelia-framework";
import { ConsoleAppender } from "aurelia-logging-console";
import { WalletManager } from 'lib/wallet-manager';
import { log } from 'lib/logger';

import fontawesome from '@fortawesome/fontawesome';
import faSpinner from '@fortawesome/fontawesome-free-solid/faSpinner';
import faEllipsisV from '@fortawesome/fontawesome-free-solid/faEllipsisV';
import faBars from '@fortawesome/fontawesome-free-solid/faBars';
import faStar from '@fortawesome/fontawesome-free-solid/faStar';
import faAddressBook from '@fortawesome/fontawesome-free-solid/faAddressBook';
import faList from '@fortawesome/fontawesome-free-solid/faList';
import faCog from '@fortawesome/fontawesome-free-solid/faCog';
import faCube from '@fortawesome/fontawesome-free-solid/faCube';
import faGavel from '@fortawesome/fontawesome-free-solid/faGavel';
import faLaptop from '@fortawesome/fontawesome-free-solid/faLaptop';
import faInfoCircle from '@fortawesome/fontawesome-free-solid/faInfoCircle';
import faCheckCircle from '@fortawesome/fontawesome-free-solid/faCheckCircle';
import faShareAlt from '@fortawesome/fontawesome-free-solid/faShareAlt';
import faQuestionCircle from '@fortawesome/fontawesome-free-solid/faQuestionCircle';
import faAmazon from '@fortawesome/fontawesome-free-brands/faAmazon';


fontawesome.library.add(faSpinner);
fontawesome.library.add(faEllipsisV);
fontawesome.library.add(faBars);
fontawesome.library.add(faStar);
fontawesome.library.add(faAddressBook);
fontawesome.library.add(faList);
fontawesome.library.add(faCog);
fontawesome.library.add(faCube);
fontawesome.library.add(faGavel);
fontawesome.library.add(faLaptop);
fontawesome.library.add(faInfoCircle);
fontawesome.library.add(faCheckCircle);
fontawesome.library.add(faShareAlt);
fontawesome.library.add(faQuestionCircle);
fontawesome.library.add(faAmazon);

let _toBalance = function(numberString, minDecimals, maxDecimals) {
    if (!maxDecimals) {
        maxDecimals = 8;
    }
    if ((minDecimals) && (minDecimals >= maxDecimals)) {
        minDecimals = maxDecimals - 1;
    }
    let indexOfDecimalPoint = numberString.indexOf('.');
    if (indexOfDecimalPoint > -1) {
        let charCountFromDecimalPointToLastDigit = numberString.length - indexOfDecimalPoint;
        if (charCountFromDecimalPointToLastDigit >= maxDecimals) {
            numberString = numberString.substring(0, indexOfDecimalPoint + maxDecimals + 1);
        }
        if (numberString.endsWith('0')) {
            numberString = numberString.replace(/0+$/,'');
        }
        if (numberString.endsWith('.')) {
            numberString = numberString.substring(0, numberString.length-1);
        }
    }
    if (minDecimals) {
        indexOfDecimalPoint = numberString.indexOf('.');
        if (indexOfDecimalPoint > -1) {
            let decimalPart = numberString.substring(indexOfDecimalPoint+1);
            if (decimalPart.length < minDecimals) {
                let decimalsToAdd = minDecimals-decimalPart.length;
                if (decimalsToAdd > 0) {
                    for (let i = 0; i < decimalsToAdd; i++) {
                        numberString = numberString + '0';
                    }
                }
            }
        } else {
            numberString = numberString + '.';
            for (let i = 0; i < minDecimals; i++) {
                numberString = numberString + '0';
            }
        }
    }
    return numberString;
}

String.prototype.toBalance = function(minDecimals, maxDecimals) {
    return _toBalance(this, minDecimals, maxDecimals);
}

Number.prototype.toBalance = function(minDecimals, maxDecimals) {
    return _toBalance(this.toString(), minDecimals, maxDecimals);
}


import 'babel-polyfill';
import 'bootstrap'; //JS

import './styles/sufee/assets/js/plugins.js';
import './styles/normalize.css';
import './styles/bootstrap.scss';
import './styles/sufee/assets/scss/style.scss';
import 'tipped/tipped.css';
import './styles/app.scss';

//import 'select2/dist/js/select2.full.js';
//import 'select2/dist/js/select2.js';
//import 'select2/dist/css/select2.css';
//import 'select2-bootstrap-theme/dist/select2-bootstrap4.css';

//import 'air-datepicker/dist/js/datepicker.js';
//import 'air-datepicker/dist/js/i18n/datepicker.en.js';
//import 'air-datepicker/dist/css/datepicker.css';

import * as Tipped from 'tipped/tipped.js';


LogManager.addAppender(new ConsoleAppender());


export function configure(aurelia) {

    aurelia.use
        .standardConfiguration()
        .plugin(PLATFORM.moduleName('aurelia-configuration'), config => {
            config.setEnvironments({
                dev: ['localhost', 'localhost:9000'],
                prod: ['webwallet.beetlecoin.io', 'webwallet.beetlecoin.network']
            });
        });

    // Uncomment the line below to enable animation.
    // aurelia.use.plugin(PLATFORM.moduleName('aurelia-animator-css'));
    // if the css animator is enabled, add swap-order="after" to all router-view elements

    // Move log level to env config
    LogManager.setLevel(LogManager.logLevel.info);

    //if (environment.testing) {
    //    aurelia.use.plugin(PLATFORM.moduleName('aurelia-testing'));
    //}

    aurelia.start().then(() => {
        let walletManager = aurelia.container.get(WalletManager);
        if (!walletManager.hasLocalStorageWallet()) {
            log.info('No existing wallet config found');
            aurelia.setRoot(PLATFORM.moduleName('wallet-init'));
        } else if (walletManager.isWalletLocked()) {
            aurelia.setRoot(PLATFORM.moduleName('wallet-unlock'));
            log.info('Existing wallet config found. Wallet is locked.');
        } else {
            log.info('Existing wallet config found. Wallet is unlocked.');
            aurelia.setRoot(PLATFORM.moduleName('wallet'));
        }
    });

}

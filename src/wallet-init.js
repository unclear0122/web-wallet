
import { ModalService } from 'components/modal-service';

import { WalletManager } from 'lib/wallet-manager';
import { UI } from 'lib/ui-assist';

import * as walletLib from 'lib/wallet-lib';
import * as coinspec from 'lib/coinspec';

import * as Tipped from 'tipped/tipped.js';


export class WalletInitApp {

    static inject() { return [ModalService, WalletManager]; }

    constructor(modalService, walletManager) {

        document.body.className = "wallet-init";

        this.modalService = modalService;
        this.walletManager = walletManager;

        this.wallet = undefined;
        this.passphrase = undefined;
        this.password = undefined;
        this.cpassword = undefined;
        this.understood = false;

        this.phrasePart1 = undefined;
        this.phrasePart2 = undefined;

        this.walletGenerationAttempted = false;
        this.walletGenerationSucceeded = false;
        this.walletRecoveryAttempted = false;
        this.walletRecoverySucceeded = false;

        this.isValidPassPhrase = false;
        this.passwordSatisfiesPolicy = false;
        this.passwordsMatch = false;

        this.selectedAction = undefined;
        this.showAdditionalWalletInfo = false;

        this.termsModal = {
            renderModalButtons: true,
            confirm: {
                text: 'Accept',
                class: 'btn-secondary',
                call: 'proceedToWallet'
            },
            cancel: {
                text: 'Reject',
                class: 'btn-danger',
                call: 'closeTermsAndConditions'
            }
        }

        this.optionsInitType = [
            {
                label: "I want to generate a new wallet",
                value: 'generate_wallet'
            },{
                label: "I want to recover an existing wallet using a pass phrase",
                value: 'recover_wallet'
            }
        ];

    }

    get showWalletDetails() {
        return this.showAdditionalWalletInfo ? true : false;
    }

    get isWalletDataAvailable() {
        return this.wallet ? true : false;
    }

    get isGeneratingNewWallet() {
        return (this.selectedAction && this.selectedAction === 'generate_wallet') ? true : false;
    }

    get isRecoveringExistingWallet() {
        return (this.selectedAction && this.selectedAction === 'recover_wallet') ? true : false;
    }

    attached() {
        document.nprogress.done();
        this.selectedAction = 'generate_wallet';
        $(document).ready(function () {
            Tipped.create('#passphrase_help', {
                inline: 'passphrase_help_content',
                radius: false,
                padding: false,
                position: 'left',
                maxWidth: 560
            });
            Tipped.create('#password_help', {
                inline: 'password_help_content',
                radius: false,
                padding: false,
                position: 'left',
                maxWidth: 560
            });
        });
    }

    actionSelected() {
        //this.wallet = undefined; // this throws a weird "obj not defined" ? not critical, so took it out
        this.passphrase = undefined;
        this.password = undefined;
        this.cpassword = undefined;
        this.understood = false;

        this.phrasePart1 = undefined;
        this.phrasePart2 = undefined;

        this.walletGenerationAttempted = false;
        this.walletGenerationSucceeded = false;
        this.walletRecoveryAttempted = false;
        this.walletRecoverySucceeded = false;

        this.isValidPassPhrase = false;
        this.passwordSatisfiesPolicy = false;
        this.passwordsMatch = false;

        this.showAdditionalWalletInfo = false;
    }

    get isRecoveryParamsValid() {
        return (this.isValidPassPhrase && this.passwordSatisfiesPolicy && this.passwordsMatch) ? true : false;
    }

    get isGenerationParamsValid() {
        return (this.passwordSatisfiesPolicy && this.passwordsMatch) ? true : false;
    }

    validatePassPhrase() {
        // phrase.trim().split(/\s+/g).length >= 12
        if (!this.passphrase) {
            this.isValidPassPhrase = false;
        } else {
            let words = this.passphrase.split(' ');
            this.isValidPassPhrase = (words && words.length >= 12 && (words[words.length-1].length > 1)) ? true : false;
        }
    }

    validatePassword() {
        this.passwordSatisfiesPolicy = (this.password && this.password.length > 7) ? true : false;
        this.validatePasswordsMatch();
    }

    validatePasswordsMatch() {
        if (!this.cpassword) {
            this.passwordsMatch = false;
        } else {
            this.passwordsMatch = this.cpassword === this.password ? true : false;
        }
    }

    generateNewWallet() {
        if (this.isGenerationParamsValid) {
            this.wallet = null;
            this.passphrase = null;
            this.phrasePart1 = null;
            this.phrasePart2 = null;
            let progress = UI.progress.start();
            walletLib.deriveWallet(coinspec.network, coinspec.derivation.path, this.walletManager.CONST.MAX_INTERNAL_ADDRESSES).then(wallet => {
                if (wallet && wallet.bip32RootKey) {
                    this.wallet = wallet;
                    this.passphrase = wallet.phrase;
                    let words = this.passphrase.split(' ');
                    this.phrasePart1 = words.slice(0, 8).join(' ');
                    this.phrasePart2 = words.slice(8).join(' ');
                    this.showAdditionalWalletInfo = false;
                    this.walletGenerationSucceeded = true;
                } else {
                    this.walletGenerationSucceeded = false;
                }
                this.walletGenerationAttempted = true;
                progress.end();
            }).catch(error => {
                this.walletGenerationSucceeded = false;
                this.walletGenerationAttempted = true;
                progress.end();
                UI.log.error('Error generateNewWallet()');
                UI.log.error(error);
            });
        }
    }

    recoverWallet() {
        if (this.isRecoveryParamsValid) {
            this.wallet = null;
            let progress = UI.progress.start();
            let phrase = this.passphrase.trim();
            walletLib.deriveWalletFromPhrase(phrase, coinspec.network, coinspec.derivation.path, this.walletManager.CONST.MAX_INTERNAL_ADDRESSES).then(wallet => {
                if (wallet && wallet.bip32RootKey) {
                    this.wallet = wallet;
                    this.showAdditionalWalletInfo = false;
                    this.walletRecoverySucceeded = true;
                } else {
                    this.walletRecoverySucceeded = false;
                }
                this.walletRecoveryAttempted = true;
                progress.end();
            }).catch(error => {
                this.walletRecoverySucceeded = false;
                this.walletRecoveryAttempted = true;
                progress.end();
                UI.log.error('Error recoverWallet()');
                UI.log.error(error);
            });
        }
    }

    showAdditionalWalletInfo() {
        this.showAdditionalWalletInfo = true;
    }

    proceedToWallet() {
        this.modalService.getModal('termsAndConditions').close();
        if (this.wallet && this.password) {
            this.walletManager.initAndNavigateToWallet(this.wallet, this.password, this.selectedAction);
        }
    }

    showTermsAndConditions() {
        this.modalService.getModal('termsAndConditions').open(this.termsModal, 'Terms and Conditions');
    }

    closeTermsAndConditions() {
        this.modalService.getModal('termsAndConditions').close();
    }

}




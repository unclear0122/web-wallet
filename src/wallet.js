
import { PLATFORM } from 'aurelia-pal';
import { Redirect } from 'aurelia-router';
import { WalletManager } from 'lib/wallet-manager';
import { log } from 'lib/logger';


export class WalletApp {

    constructor() {
        document.body.className = "wallet-app";
    }

    attached() {
        //$.noConflict();
        $(document).ready(function ($) {
            "use strict";
            $('.selectpicker').selectpicker;
            $('#menuToggle').on('click', function (event) {
                $('body').toggleClass('open');

            });
            $('.search-trigger').on('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                $('.search-trigger').parent('.header-left').addClass('open');
            });
            $('.search-close').on('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                $('.search-trigger').parent('.header-left').removeClass('open');
            });
        });
    }

    configureRouter(config, router) {

        this.router = router;

        if (!router.hasOwnProperty("__currentRoute")) {
            try {
                Object.defineProperty(router, "__currentRoute", {
                    get: function () {
                        try {
                            if (!this.currentInstruction) {
                                return null;
                            }
                            return this.currentInstruction.config;
                        } catch (e) {
                            console.log('Failed to return __currentRoute ' + e);
                            return null;
                        }
                    },
                    configurable: true,
                    enumerable: true
                });
            } catch (e) {
                console.log('Failed add custom getter "__currentRoute" to router. ' + e);
            }
        }

        config.title = 'Beetle Coin';
        config.mapUnknownRoutes('views/404');
        config.addPipelineStep('authorize', AuthorizeStep);
        config.map([
            {
                route: ['','balance'],
                name: 'balance',
                title: 'Balance',
                moduleId: PLATFORM.moduleName('views/balance'),
                breadcrumb: [ { label: 'Wallet' }, { label: 'Balance', active: true } ],
                icon: 'fa-star'
            },{
                route: 'details',
                name: 'details',
                title: 'Wallet Details',
                moduleId: PLATFORM.moduleName('views/wallet-details'),
                breadcrumb: [ { label: 'Wallet' }, { label: 'Details', active: true } ],
                icon: 'fa-archive'
            },{
                route: 'address-book',
                name: 'address-book',
                moduleId: PLATFORM.moduleName('views/address-book'),
                title: 'Address Book',
                breadcrumb: [ { label: 'Wallet' }, { label: 'Address Book', active: true } ],
                icon: 'fa-address-book'
            },{
                route: 'transactions',
                name: 'transactions',
                moduleId: PLATFORM.moduleName('views/transactions'),
                title: 'Transactions',
                breadcrumb: [ { label: 'Transactions' }, { label: 'Transactions', active: true } ],
                icon: 'fa-list'
            },{
                route: 'preferences',
                name: 'preferences',
                title: 'Preferences',
                moduleId: PLATFORM.moduleName('views/preferences'),
                breadcrumb: [ { label: 'Wallet' }, { label: 'Preferences', active: true } ],
                icon: 'fa-cog'
            },{
                route: 'terms',
                name: 'terms',
                title: 'Legal',
                moduleId: PLATFORM.moduleName('views/terms'),
                breadcrumb: [ { label: 'Wallet' }, { label: 'Legal', active: true } ],
                icon: 'fa-gavel'
            },{
                route: 'roadmap',
                name: 'roadmap',
                title: 'Roadmap',
                moduleId: PLATFORM.moduleName('views/roadmap'),
                breadcrumb: [ { label: 'Wallet' }, { label: 'Roadmap', active: true } ],
                icon: 'fa-laptop'
            },{
                route: 'status',
                name: 'status',
                title: 'Network Status',
                moduleId: PLATFORM.moduleName('views/network-status'),
                breadcrumb: [ { label: 'Network' }, { label: 'Status', active: true } ],
                icon: 'fa-check-circle'
            },{
                route: 'masternodes',
                name: 'masternodes',
                title: 'Master Nodes',
                moduleId: PLATFORM.moduleName('views/master-nodes'),
                breadcrumb: [ { label: 'Network' }, { label: 'Master Nodes', active: true } ],
                icon: 'fa-share-alt'
            },{
                route: 'not-found',
                name: 'not-found',
                title: 'Not Found',
                moduleId: PLATFORM.moduleName('views/404'),
                breadcrumb: [ { label: 'System' }, { label: '404', active: true } ],
                icon: 'fa-star'
            },{
                route: 'offline',
                name: 'offline',
                title: 'Offline',
                moduleId: PLATFORM.moduleName('views/offline'),
                breadcrumb: [ { label: 'System' }, { label: 'Offline', active: true } ],
                icon: 'fa-star'
            }
        ]);

    }

}

class AuthorizeStep {

    static inject() { return [WalletManager]; }

    constructor(walletManager) {
        this.walletManager = walletManager;

    }

    run(navigationInstruction, next) {
        /*
        if (navigationInstruction.getAllInstructions().some(i => i.config.settings.roles.indexOf('admin') !== -1)) {
            var isAdmin =  ...;
            if (!isAdmin) {
                return next.cancel(new Redirect('welcome'));
            }
        }
        */
        if (this.walletManager.isWalletLocked()) {
            log.info('Wallet is locked');
            this.walletManager.navigateToUnlockScreen();
            //return next.cancel(new Redirect('unlock'));
            return next.cancel();
        }
        return next();
    }

}

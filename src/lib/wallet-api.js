
import { inject } from 'aurelia-framework';
import { HttpClient } from 'aurelia-http-client';
import { AureliaConfiguration } from 'aurelia-configuration';

import * as lang from './lang.js';

@inject(HttpClient, AureliaConfiguration)
export class WalletApi {

    constructor(http, config) {
        this.http = http;
        this.config = config;
        this.jwtoken = null;
        this.configure();
    }

    configure(authToken) {
        let timeout = authToken ? 250 : 50;
        return new Promise((resolve, reject) => {
            this.http.configure(c => {
                c.withBaseUrl(this.config.get('api.endpoint'));
                c.withCredentials();
                c.withHeader('Content-Type', 'application/json');
                //c.withHeader('Authorization', 'Basic ' + btoa('user:passwd'));
                if (authToken) {
                    this.jwtoken = authToken;
                    c.withHeader('Authorization', authToken);
                }
            });
            setTimeout(function () {
                resolve();
            }, timeout);
        });
    }

    getSessionToken(id) {
        return new Promise((resolve, reject) => {
            this.http.post('/auth/verify', JSON.stringify(id)).then(response => {
                this.configure(response.content).then(() => {
                    resolve(response.content);
                });
            }).catch(error => {
                reject(error);
            });
        });
    }

    getNodeInfo() {
        return new Promise((resolve, reject) => {
            this.http.get('/network/info').then(response => {
                resolve(response.content);
            }).catch(error => {
                reject(error);
            });
        });
    }

    // getAddressBalance(address) {
    //     //http://explorer.beetlecoin.io/ext/getbalance/BZBPUrzVUupN7ScKeuBpoyGDWDnyLyr9T2
    //     return new Promise((resolve, reject) => {
    //         this.http.get('/network/info').then(response => {
    //             resolve(response.content);
    //         }).catch(error => {
    //             reject(error);
    //         });
    //     });
    // }

    getAddressInfo(address) {
        return new Promise((resolve, reject) => {
            this.http.get('/address/'+address).then(response => {
                if (response.content.error) {
                    reject(response.content.error);
                } else if (!response.content) {
                    resolve({ isvalid: false });
                } else {
                    resolve(response.content);
                }
            }).catch(error => {
                reject(error);
            });
        });
    }

    getSpendableOutputsForAddress(addresses) {
        return new Promise((resolve, reject) => {
            if (lang.isArray(addresses)) {
                addresses = addresses.join(',');
            }
            this.http.post('/address/utxos', JSON.stringify(addresses)).then(response => {
                if (response.content.error) {
                    reject(response.content.error);
                } else if (!response.content) {
                    resolve([]);
                } else {
                    resolve(response.content);
                }
            }).catch(error => {
                reject(error);
            });
        });
    }

    isAddressRegistered(address) {
        return new Promise((resolve, reject) => {
            return this.getAddressInfo(address).then(result => {
                if (result.isvalid && result.isregistered) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }).catch(error => {
                reject(error);
            });
        });
    }

    isAddressListRegistered(addresses, updateInPlace) {
        return new Promise((resolve, reject) => {
            let addressList = addresses.map(function(address) { return address.address; });
            addressList = addressList.join(',');
            this.http.post('/address/status', JSON.stringify(addressList)).then(response => {
                if (updateInPlace) {
                    for (let address of addresses) {
                        let isregistered = (response.content[address.address] && response.content[address.address].isregistered) ? true : false;
                        address.isregistered = isregistered;
                    }
                    resolve(addresses);
                } else {
                    let list = [];
                    for (let address of addresses) {
                        let isregistered = (response.content[address.address] && response.content[address.address].isregistered) ? true : false;
                        if (address.hasOwnProperty('index')) {
                            list.push({ address: address.address, isregistered: isregistered, index: address.index });
                        } else {
                            list.push({ address: address.address, isregistered: isregistered });
                        }
                    }
                    resolve(list);
                }
            }).catch(error => {
                reject(error);
            });
        });
    }

    getAllRegisteredAddresses() {
        return new Promise((resolve, reject) => {
            this.http.get('/address/list').then(response => {
                if (response.content.error) {
                    reject(response.content.error);
                } else if (!response.content) {
                    resolve([]);
                } else {
                    resolve(response.content);
                }
            }).catch(error => {
                reject(error);
            });
        });
    }

    registerWatchOnlyAddress(address, label, rescan) {
        label = label ? label : '';
        rescan = rescan ? rescan : 'false';
        return new Promise((resolve, reject) => {
            this.http.post('/address/register', JSON.stringify({ address: address, label: label, rescan: rescan })).then(response => {
                resolve(response.content);
            }).catch(error => {
                reject(error);
            });
        });
    }

    registerWatchOnlyAddressList(addresses, rescan) {
        let addressList = addresses.map(function(address) {
            return {
                address: address,
                label: null,
                rescan: rescan
            }
        });

        return new Promise((resolve, reject) => {
            this.http.post('/address/register', JSON.stringify(addressList)).then(response => {
                resolve(response.content);
            }).catch(error => {
                reject(error);
            });
        });

        // let that = this;
        // let promises = [];
        // for (let address of addresses) {
        //     promises.push(new Promise(function (resolve, reject) {
        //         return that.registerWatchOnlyAddress(address, null, rescan).then(result => {
        //             resolve(result);
        //         });
        //     }));
        // }
        // return Promise.all(promises);
    }

    broadcastTx(txhex) {
        return new Promise((resolve, reject) => {
            this.http.post('/tx/broadcast', JSON.stringify(txhex)).then(response => {
                resolve(response.content);
            }).catch(error => {
                reject(error);
            });
        });
    }

    getDevelopmentRoadmap() {
        return new Promise((resolve, reject) => {
            this.http.get('/beetle/roadmap').then(response => {
                resolve(response.content);
            }).catch(error => {
                reject(error);
            });
        });
    }

}

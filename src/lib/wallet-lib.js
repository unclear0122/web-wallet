

/*
 * This whole lib is currently being moved into a separate standalone project (for wider usage availability) where it is
 * also being refactored and improved with proper unit test coverage. Once ready, it will be removed from here, and
 * included via package dependency.
 */

let bip39 = require('bip39');
let bitcoin = require('bitcoinjs-lib');
let orderBy = require('lodash.orderby');
let decimal = require('decimal.js');
let coinspec = require('./coinspec');

// BIP32 = custom derivation path and optional useHardenedAddresses
// BIP44
// BIP38 = password encrypt the BIP44 addresses
// BIP39 = mnemonic phrase generation, with an optional password

/*
let useHardenedAddresses = false;
let useBip38 = false;

let network = {
    messagePrefix: '\x19Beetlecoin Signed Message:\n',
    bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4
    },
    pubKeyHash: 0x1A,   // 26
    scriptHash: 0x55,   // 85
    wif: 0x99,          // 153
}

let derivation = {
    bip44purpose: 44,
    bip44coin: 800,
    bip44account: 0,
    bip44change: 0
}
*/

function _parseIntNoNaN(val, defaultVal) {
    let v = parseInt(val);
    if (isNaN(v)) {
        return defaultVal;
    }
    return v;
}

function _hasStrongRandom() {
    // Check if the browser has the standard crypto lib available
    return 'crypto' in window && window['crypto'] !== null;
}

function generateRandomPhrase(numWords) {
    let strength = parseInt(numWords) / 3 * 32;
    let wordPhrase = bip39.generateMnemonic(strength);
    return wordPhrase;
}

function calcBip32RootKeyFromPhrase(network, phrase, passphrase) {
    let seed = bip39.mnemonicToSeedHex(phrase, passphrase);
    let bip32RootKey = bitcoin.HDNode.fromSeedHex(seed, network);
    return bip32RootKey; // bip32RootKey.toBase58();
}

function calcBip32RootKeyFromBase58(rootKeyBase58, network) {
    return bitcoin.HDNode.fromBase58(rootKeyBase58, network);
}

function toDerivationPath(derivation) {
    let purpose = _parseIntNoNaN(derivation.bip44purpose, 44);
    let coin = _parseIntNoNaN(derivation.bip44coin, 800);
    let account = _parseIntNoNaN(derivation.bip44account, 0);
    let change = _parseIntNoNaN(derivation.bip44change, 0);
    let path = "m/";
    path += purpose + "'/";
    path += coin + "'/";
    path += account + "'/";
    path += change;
    return path;
}

function calcBip32ExtendedKey(bip32RootKey, path) {
    // Check there's a root key to derive from
    if (!bip32RootKey) {
        return bip32RootKey;
    }
    let extendedKey = bip32RootKey;
    // Derive the key from the path
    let pathBits = path.split("/");
    for (let i = 0; i < pathBits.length; i++) {
        let bit = pathBits[i];
        let index = parseInt(bit);
        if (isNaN(index)) {
            continue;
        }
        let hardened = bit[bit.length-1] == "'";
        let isPriv = !(extendedKey.isNeutered());
        let invalidDerivationPath = hardened && !isPriv;
        if (invalidDerivationPath) {
            extendedKey = null;
        } else if (hardened) {
            extendedKey = extendedKey.deriveHardened(index);
        }
        else {
            extendedKey = extendedKey.derive(index);
        }
    }
    return extendedKey;
}

function deriveAddresses(amount, network, derivationPath, bip32ExtendedKey, useHardenedAddresses, useBip38, bip38password) {
    if (!amount) {
        amount = 10;
    }
    let that = this;
    let promises = [];
    for (let i = 0; i < amount; i++) {
        promises.push(new Promise(function (resolve, reject) {
            return deriveAddressForIndex(i, network, derivationPath, bip32ExtendedKey, useHardenedAddresses, useBip38, bip38password).then(result => {
                resolve(result);
            });
        }));
    }
    return Promise.all(promises);
    //return new Promise((resolve, reject) => {
    //    return Promise.all(promises).then((result) => {
    //        resolve(result);
    //    }).catch(e => {
    //        reject(e);
    //    });
    //});
}

function deriveAddressForIndex(index, network, derivationPath, bip32ExtendedKey, useHardenedAddresses, useBip38, bip38password) {

    return new Promise((resolve, reject) => {

        // derive HDkey for this row of the table
        let key = "NA";
        if (useHardenedAddresses) {
            key = bip32ExtendedKey.deriveHardened(index);
        }
        else {
            key = bip32ExtendedKey.derive(index);
        }

        // bip38 requires uncompressed keys
        // see https://github.com/iancoleman/bip39/issues/140#issuecomment-352164035
        let keyPair = key.keyPair;
        let useUncompressed = useBip38;
        if (useUncompressed) {
            keyPair = new bitcoin.ECPair(keyPair.d, null, { compressed: false });
        }

        // get address
        let address = keyPair.getAddress().toString();

        // get privkey
        let hasPrivkey = !key.isNeutered();
        let privkey = "NA";
        if (hasPrivkey) {
            privkey = keyPair.toWIF(network);
            // BIP38 encode private key if required
            if (useBip38) {
                privkey = bitcoinjsBip38.encrypt(keyPair.d.toBuffer(), false, bip38password, function(p) {
                    console.log("Progressed " + p.percent.toFixed(1) + "% for index " + index);
                });
            }
        }

        // get pubkey
        let pubkey = keyPair.getPublicKeyBuffer().toString('hex');
        let indexText = derivationPath + "/" + index;
        if (useHardenedAddresses) {
            indexText = indexText + "'";
        }

        resolve({
            index: index,
            address: address,
            pubkey: pubkey,
            privkey: privkey
        });

        // Segwit addresses are different
        /*
        if (isSegwit) {
            if (!segwitAvailable) {
                return;
            }
            if (isP2wpkh) {
                var keyhash = bitcoinjs.bitcoin.crypto.hash160(key.getPublicKeyBuffer());
                var scriptpubkey = bitcoinjs.bitcoin.script.witnessPubKeyHash.output.encode(keyhash);
                address = bitcoinjs.bitcoin.address.fromOutputScript(scriptpubkey, network)
            }
            else if (isP2wpkhInP2sh) {
                var keyhash = bitcoinjs.bitcoin.crypto.hash160(key.getPublicKeyBuffer());
                var scriptsig = bitcoinjs.bitcoin.script.witnessPubKeyHash.output.encode(keyhash);
                var addressbytes = bitcoinjs.bitcoin.crypto.hash160(scriptsig);
                var scriptpubkey = bitcoinjs.bitcoin.script.scriptHash.output.encode(addressbytes);
                address = bitcoinjs.bitcoin.address.fromOutputScript(scriptpubkey, network)
            }
        }
        */

    });
}

function deriveAddressFromPrivateKey(privateKey) {
    let keyPair = bitcoin.ECPair.fromWIF(privateKey, coinspec.network);
    return keyPair.getAddress().toString();
}

function isValidAddress(address) {
    try {
        let result = bitcoin.address.fromBase58Check(address);
        if (result && result.version) { // && result.version === 26
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

function deriveWallet(network, derivationPath, numberOfAddresses) {
    let phrase = generateRandomPhrase(15);
    return this.deriveWalletFromPhrase(phrase, network, derivationPath, numberOfAddresses);
}

function deriveWalletFromPhrase(phrase, network, derivationPath, numberOfAddresses) {

    return new Promise((resolve, reject) => {

        let bip32RootKey = calcBip32RootKeyFromPhrase(network, phrase);
        let bip32ExtendedKey = calcBip32ExtendedKey(bip32RootKey, derivationPath);
        let wallet = {
            phrase: phrase,
            bip32RootKey: bip32RootKey.toBase58(),
            bip32ExtendedKey: bip32ExtendedKey.toBase58(),
            derivationPath: derivationPath,
            addresses: []
        }

        return deriveAddresses(numberOfAddresses, network, derivationPath, bip32ExtendedKey).then(result => {
            wallet.addresses = result;
            resolve(wallet);
        });

    });

}

function estimateTxFee(payAmount, fromAddresses, lockTxAmount, minConfirmations) {

    // FEE = 0.1 BEET per 1000 bytes
    // 1 UTXO == roughly 226 bytes
    // Therefore, 0.1 BEET per 6 selected UTXO's
    // To be safe, settle on 0.1 BEET per 5 UTXO's ??

    payAmount = new decimal.Decimal(payAmount);

    let baseFee = new decimal.Decimal(0.01);

    let calculatedFee = baseFee.toNumber();
    let payAmountInclFees = payAmount.plus(calculatedFee);

    let availableInputs = [];
    let totalAmountAvailableFromInputs = new decimal.Decimal(0);

    for (let fromAddress of fromAddresses) {
        if (fromAddress.privkey && fromAddress.utxos) {
            for (let utxo of fromAddress.utxos) {
                if (utxo.amount > 0) {
                    if (lockTxAmount && (lockTxAmount > 0) && (lockTxAmount === utxo.amount)) {
                    } else if (minConfirmations && (minConfirmations > 0) && (utxo.confirmations <= minConfirmations)) {
                    } else {
                        totalAmountAvailableFromInputs = totalAmountAvailableFromInputs.plus(utxo.amount);
                        availableInputs.push(utxo);
                    }
                }
            }
        }
    };

    let sortDirection = 'asc'; // (utxoSelectionStrategy && utxoSelectionStrategy === 'fewest') ? 'desc' : 'asc';

    let sortedAvailableInputs = orderBy(availableInputs, ['amount'], [sortDirection]);
    let selectedInputs = [];

    let totalAmountFromSelectedOutputs = new decimal.Decimal(0);
    for (let input of sortedAvailableInputs) {
        if (totalAmountFromSelectedOutputs.greaterThan(payAmountInclFees)) {
            //console.log('No further utxos needed to cover payment');
            break;
        } else {
            if (input.amount && input.amount > 0) {
                selectedInputs.push(input);
                totalAmountFromSelectedOutputs = totalAmountFromSelectedOutputs.plus(input.amount);
                if (selectedInputs.length > 1) {
                    calculatedFee = baseFee.times(Math.ceil(selectedInputs.length / 5)).toNumber();
                }
                payAmountInclFees = payAmount.plus(calculatedFee);
            }
        }
    }

    return calculatedFee; //.toNumber();

}

function createSignedTransaction(payAmount, toAddress, fromAddresses, changeAddress, lockTxAmount, minConfirmations, utxoSelectionStrategy) {

    // 1 satoshi = 0.00000001 BTC
    // 100 000 000 satoshi = 1 BTC
    // 0.85×100000000 = 85000000

    let baseFee = new decimal.Decimal(0.01);
    let fee = new decimal.Decimal(0.01);

    payAmount = new decimal.Decimal(payAmount);

    let payAmountSatoshi = payAmount.times(100000000);
    let payAmountInclFees = payAmount.plus(fee);

    let availableInputs = [];
    let totalAmountAvailableFromInputs = new decimal.Decimal(0);
    let totalAmountAvailableFromInputsSatoshi = new decimal.Decimal(0);

    let keys = {};
    for (let fromAddress of fromAddresses) {
        if (fromAddress.privkey && fromAddress.utxos) {
            let keyPair = bitcoin.ECPair.fromWIF(fromAddress.privkey, coinspec.network);
            let derivedAddress = keyPair.getAddress().toString();
            keys[derivedAddress] = keyPair;
            if (derivedAddress === fromAddress.address) {
                for (let utxo of fromAddress.utxos) {
                    if ((utxo.address === derivedAddress) && (utxo.amount > 0)) {
                        if (lockTxAmount && (lockTxAmount > 0) && (lockTxAmount === utxo.amount)) {
                            console.log('Found MN utxo. Skipping.');
                        } else if (minConfirmations && (minConfirmations > 0) && (utxo.confirmations <= minConfirmations)) {
                            console.log('Found utxo without required confirmations. Skipping.');
                        } else {
                            totalAmountAvailableFromInputs = totalAmountAvailableFromInputs.plus(utxo.amount);
                            availableInputs.push(utxo);
                        }
                    }
                }
            }
        }
    };

    totalAmountAvailableFromInputsSatoshi = totalAmountAvailableFromInputs.times(100000000);

    try {

        let sortDirection = 'asc'; // (utxoSelectionStrategy && utxoSelectionStrategy === 'fewest') ? 'desc' : 'asc';

        let sortedAvailableInputs = orderBy(availableInputs, ['amount'], [sortDirection]);
        let selectedInputAddresses = [];
        let selectedInputs = [];

        var txb = new bitcoin.TransactionBuilder(coinspec.network);

        // todo validate addresses
        let totalAmountFromSelectedOutputs = new decimal.Decimal(0);
        for (let input of sortedAvailableInputs) {
            if (totalAmountFromSelectedOutputs.greaterThan(payAmountInclFees)) {
            //if (totalAmountFromSelectedOutputs.greaterThanOrEqualTo(payAmountInclFees)) {
                console.log('No further utxos needed to cover payment');
                //console.log('Ignoring utxo as input: ' + input.utxo.txid + ', ' + input.utxo.vout + ', ' + input.utxo.amount);
                break;
            } else {
                if (input.amount && input.amount > 0) {
                    console.log('Adding utxo as input: ' + input.txid + ' ' + input.vout + ' (' + input.amount + ')');
                    txb.addInput(input.txid, input.vout);
                    if (selectedInputAddresses.indexOf(input.address) < 0) {
                        selectedInputAddresses.push(input.address);
                    }
                    selectedInputs.push(input);
                    totalAmountFromSelectedOutputs = totalAmountFromSelectedOutputs.plus(input.amount);
                    if (selectedInputs.length > 1) {
                        fee = baseFee.times(Math.ceil(selectedInputs.length / 5)).toNumber();
                    }
                    payAmountInclFees = payAmount.plus(fee);
                }
            }
        }

        selectedInputAddresses = selectedInputAddresses.join();

        if (!changeAddress && selectedInputs && selectedInputs.length > 0) {
            changeAddress = selectedInputs[0].address;
        }

        let payAmountInclFeesSatoshi = payAmountInclFees.times(100000000);

        let totalAmountFromSelectedOutputsSatoshi = totalAmountFromSelectedOutputs.times(100000000);
        let changeAmountSatoshi = totalAmountFromSelectedOutputsSatoshi.minus(payAmountInclFeesSatoshi);
        let changeAmount = changeAmountSatoshi.dividedBy(100000000);

        let payAmountPlusChange = changeAmount.plus(payAmount);
        let txFee = totalAmountFromSelectedOutputs.minus(payAmountPlusChange);

        let outputs = [];

        console.log('Adding payment of ' + payAmount + ' (' + payAmountSatoshi.toNumber() + ') to ' + toAddress);
        txb.addOutput(toAddress, payAmountSatoshi.toNumber());
        outputs.push({ address: toAddress, amount: payAmount, type: 'payee' });

        if (changeAmount.lessThanOrEqualTo(0.00000001)) {
            //console.log('Change is 0, no change payment added');
        } else {
            console.log('Adding change payment of ' + changeAmount + ' (' + changeAmountSatoshi.toNumber() + ') to ' + changeAddress);
            txb.addOutput(changeAddress, changeAmountSatoshi.toNumber());
            outputs.push({ address: changeAddress, amount: changeAmount, type: 'change' });
        }

        for (let i = 0; i < selectedInputs.length; i++) {
            //console.log('Signing input ' + i + ' ' + selectedInputs[i].address);
            txb.sign(i, keys[selectedInputs[i].address]);
        }

        if (changeAmount.lessThanOrEqualTo(0.00000001)) {
            changeAmount = new decimal.Decimal(0);
            changeAmountSatoshi = new decimal.Decimal(0);
        }

        let txDetails = {
            payAddress: toAddress,
            fromAddresses: selectedInputAddresses,
            changeAddress: changeAddress,
            inputs: selectedInputs,
            outputs: outputs,
            totals: {
                availableFromInputs: {
                    value: totalAmountAvailableFromInputs.toNumber(),
                    satoshi: totalAmountAvailableFromInputsSatoshi.toNumber()
                },
                selectedFromOutputs: {
                    value: totalAmountFromSelectedOutputs.toNumber(),
                    satoshi: totalAmountFromSelectedOutputsSatoshi.toNumber()
                },
                payAmountInclFees: {
                    value: payAmountInclFees.toNumber(),
                    satoshi: payAmountInclFeesSatoshi.toNumber()
                },
                payAmount: {
                    value: payAmount.toNumber(),
                    satoshi: payAmountSatoshi.toNumber(),
                },
                changeAmount: {
                    value: changeAmount.toNumber(),
                    satoshi: changeAmountSatoshi.toNumber(),
                },
                payAmountPlusChange: {
                    value: payAmountPlusChange.toNumber(),
                    satoshi: payAmountPlusChange.times(100000000)
                },
                txFee: {
                    value: txFee.toNumber(),
                    satoshi: txFee.times(100000000)
                }
            }
        }

        let tx = txb.build();
        txDetails.hex = tx.toHex();
        txDetails.txid = tx.getId();

        return txDetails;

    } catch (e) {

        console.log('createSignedTransaction error');
        console.log(e);

    }

}

/*
decodeTransaction = function(hex) {
    var tx = new bitcoin.Transaction.fromHex(hex);
    //console.log(hex);
    //console.log(tx);
    return tx;
}

broadCastTransaction = function(transaction) {
    if (langUtil.isObject(transaction)) {
        transaction = transaction.hex;
    }
}
*/


_buildTransaction = function (inputs, outputs, feeMax, external, internal, nLockTime) {

    if (!isFinite(feeMax)) throw new TypeError('Expected finite maximum fee')
    if (feeMax > 0.2 * 1e8) throw new Error('Maximum fee is absurd: ' + feeMax)

    external = external || this.external
    internal = internal || this.internal
    var network = this.getNetwork()

    // sanity checks
    var inputValue = inputs.reduce(function (a, x) { return a + x.value }, 0)
    var outputValue = outputs.reduce(function (a, x) { return a + x.value }, 0)
    if (outputValue > inputValue) throw new Error('Not enough funds: ' + inputValue + ' < ' + outputValue)

    // clone the internal chain to avoid inadvertently moving the wallet forward before usage
    var chain = this.account.getChain(1).clone()

    // map outputs to be BIP69 compatible
    // add missing change outputs
    outputs = outputs.map(function (output) {
        var script = output.script
        if (!script && output.address) {
            script = bitcoin.address.toOutputScript(output.address, network)
        }

        if (!script) {
            script = bitcoin.address.toOutputScript(chain.get(), network)
            chain.next()
        }

        return {
            script: script,
            value: output.value
        }
    })

    var fee = inputValue - outputValue
    if (fee > feeMax) throw new Error('Fee is too high: ' + feeMax)

    // apply BIP69 for improved privacy
    inputs = bip69.sortInputs(inputs.concat())
    outputs = bip69.sortOutputs(outputs)

    // get associated private keys
    var addresses = inputs.map(function (input) { return input.address })
    var children = this.account.getChildren(addresses, [external, internal])

    // build transaction
    var txb = new bitcoin.TransactionBuilder(network)

    if (nLockTime !== undefined) {
        txb.setLockTime(nLockTime)
    }

    inputs.forEach(function (input) {
        txb.addInput(input.txId, input.vout, input.sequence, input.prevOutScript)
    })

    outputs.forEach(function (output) {
        txb.addOutput(output.script, output.value)
    })

    // sign and return
    children.forEach(function (child, i) {
        txb.sign(i, child.keyPair)
    })

    return {
        fee: fee,
        transaction: txb.build()
    }
}

function hasDerivationPathErrors(path) {

    // TODO is not perfect but is better than nothing
    // Inspired by
    // https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#test-vectors
    // and
    // https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#extended-keys

    let maxDepth = 255; // TODO verify this!!
    let maxIndexValue = Math.pow(2, 31); // TODO verify this!!

    if (path[0] != "m") {
        return "First character must be 'm'";
    }

    if (path.length > 1) {
        if (path[1] != "/") {
            return "Separator must be '/'";
        }
        let indexes = path.split("/");
        if (indexes.length > maxDepth) {
            return "Derivation depth is " + indexes.length + ", must be less than " + maxDepth;
        }
        for (let depth = 1; depth<indexes.length; depth++) {
            let index = indexes[depth];
            let invalidChars = index.replace(/^[0-9]+'?$/g, "")
            if (invalidChars.length > 0) {
                return "Invalid characters " + invalidChars + " found at depth " + depth;
            }
            let indexValue = parseInt(index.replace("'", ""));
            if (isNaN(depth)) {
                return "Invalid number at depth " + depth;
            }
            if (indexValue > maxIndexValue) {
                return "Value of " + indexValue + " at depth " + depth + " must be less than " + maxIndexValue;
            }
        }
    }

    /*
    // Check root key exists or else derivation path is useless!
    if (!bip32RootKey) {
        return "No root key";
    }
    // Check no hardened derivation path when using xpub keys
    var hardenedPath = path.indexOf("'") > -1;
    var hardenedAddresses = bip32TabSelected() && DOM.hardenedAddresses.prop("checked");
    var hardened = hardenedPath || hardenedAddresses;
    var isXpubkey = bip32RootKey.isNeutered();
    if (hardened && isXpubkey) {
        return "Hardened derivation path is invalid with xpub key";
    }
    */

    return false;

}

//deriveWallet(network, derivation).then(wallet => {
//    console.log(wallet);
//})

exports.generateRandomPhrase = generateRandomPhrase;
exports.toDerivationPath = toDerivationPath;
exports.deriveWallet = deriveWallet;
exports.deriveWalletFromPhrase = deriveWalletFromPhrase;
exports.deriveAddressFromPrivateKey = deriveAddressFromPrivateKey;
exports.isValidAddress = isValidAddress;
exports.estimateTxFee = estimateTxFee;
exports.createSignedTransaction = createSignedTransaction;

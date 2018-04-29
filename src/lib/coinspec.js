

let network = {
    messagePrefix: '\x19Beetlecoin Signed Message:\n',
    bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4
    },
    pubKeyHash: 0x1A,       // 26 'version'
    scriptHash: 0x55,       // 85
    wif: 0x99,              // 153
}

let derivationPath = "m/44'/800'/0'/0";

let derivation = {
    purpose: 44,
    coin: 800,
    account: 0,
    change: 0,
    bip44purpose: 44,
    bip44coin: 800,
    bip44account: 0,
    bip44change: 0,
    path: derivationPath
}

exports.network = network;
exports.derivation = derivation;
exports.derivationPath = derivationPath;

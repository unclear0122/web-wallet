
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
        /*
        let indexOfLastZero = numberString.lastIndexOf('0');
        if (indexOfLastZero > indexOfDecimalPoint) {
            let charCountFromDecimalPointToLastZero = indexOfLastZero - indexOfDecimalPoint;
            if (charCountFromDecimalPointToLastZero >= maxDecimals) {
                numberString = numberString.substring(0, indexOfDecimalPoint + maxDecimals + 1);
            }
        }
        */
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

export class NumberFormatValueConverter {

    toView(value, format) {

        if (!value) {
            value = 0;
        }
        if (format === 'round-up') {
            return Math.ceil(value);
        } else if (format === 'round-down') {
            return Math.floor(value);
        } else if (format === 'balance') {
            return _toBalance(value.toString(), 2);
        } else {
            return _toBalance(value.toString());
        }

    }

}


//const async = require('async');

function adjustDateForTimezone(date) {
    if (!isDate(date)) {
        date = new Date(date);
    }
    let timeOffsetInMS = date.getTimezoneOffset() * 60000;
    date.setTime(date.getTime() - timeOffsetInMS);
    return date;
}

function toDateTime(date, adjustForTimezone) {
    if (!isDate(date)) {
        date = new Date(date);
    }
    if (adjustForTimezone) {
        date = adjustDateForTimezone(date);
    }
    let sanitizedISODate = date.toISOString().replace(/T/,' ');
    sanitizedISODate = sanitizedISODate.substring(0, sanitizedISODate.length-5);
    return sanitizedISODate;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getValueType(val) {
    if (isString(val)) {
        return "string";
    } else if (isBoolean(val)) {
        return "boolean";
    } else if (isNumber(val)) {
        return "number";
    } else if (isDate(val)) {
        return "date";
    } else if (isArray(val)) {
        return "array";
    } else if (isPlainObject(val)) {
        return "object";
    } else if (isFunction(val)) {
        return "function"
    } else {
        return "?";
    }
}

function isString(val) {
    if (!val) {
        return false;
    }
    if (typeof val === 'string' || val instanceof String) {
        return true;
    }
    return false;
}

function isBoolean(val) {
  return typeof val === 'boolean' ? true : false;
}

function isBooleanLike(val) {
  if (isBoolean(val)) {
      return true;
  } else if (isString(val)) {
      if ((val.trim().toLowerCase() === 'true') || (val.trim().toLowerCase() === 'false')) {
          return true;
      } else {
          return false;
      }
  } else {
      return false;
  }
}

function isNumber(val) {
    return typeof val === 'number' ? true : false;
    //return !isNaN(parseFloat(val)) && isFinite(val);
}

function isNumberString(val) {
    if ((typeof val === 'string') && (!isNaN(val))) {
        return true;
    }
    return false;
}

function isNumberLike(val) {
    if (isNumber(val) || (isNumberString(val))) {
        return true;
    }
    return false;
}

function isNumeric(val) {
    return !isNaN(parseFloat(val)) && isFinite(val);
}

function isFunction(val) {
    if (!val) {
        return false;
    }
    if (typeof val === 'function' || val instanceof Function) {
        return true;
    }
    return false;
    //return !!(val && val.constructor && val.call && val.apply);
}

function isObject(val) {
    if (!val) {
        return false;
    }
    if (typeof val === 'object') {
        if (val.constructor === Array) {
            return false;
        } else {
            return true;
        }
    }
    return false;
}

function isPlainObject(val) {
    if (isObject(val)) {
        if (isDate(val)) {
            return false;
        } else {
            return true;
        }
    }
    return false;
}

function isArray(val) {
    if (!val) {
        return false;
    }
    if (val.constructor === Array) {
        return true;
    }
    return false;
}

function isDate(val) {
    if (!val) {
        return false;
    }
    if ((typeof val === 'object') && (val instanceof Date)) {
        return true;
    }
    return false;
}

function isPrimitiveLike(val) {
    if (isBoolean(val)) {
        return true;
    }
    if (!val) {
        return false;
    }
    if ((isString(val)) || (isNumber(val)) || isDate(val)) {
        return true;
    }
    return false;
}

function toBoolean(value) {
    if (!value) {
        return false;
    }
    if (typeof(value) == 'string'){
        value = value.toLowerCase();
    }
    switch(value) {
        case true:
        case "true":
        case 1:
        case "1":
            return true;
        default:
            return false;
    }
}

function toArrayString(arr) {
    return "'" + arr.join("','") + "'";
}

function getBasePath(str, delimiter) {
    if (!delimiter) {
        delimiter = '.';
    }
    let lastIndexOf = str.lastIndexOf(delimiter);
    if (lastIndexOf === -1 || lastIndexOf === 0) {
        return str;
    }
    return str.substr(0, str.lastIndexOf(delimiter));
}
function isEqualSet(set1, set2) {
    if (set1.size !== set2.size) return false;
    for (let s1 of set1) if (!set2.has(s1)) return false;
    return true;
}


function getLastPathValue(str, delimiter) {
    if (!delimiter) {
        delimiter = '.';
    }
    if (str.lastIndexOf(delimiter) === -1) {
        return str;
    }
    return str.substr(str.lastIndexOf(delimiter)+1);
}

function getFirstPathValue(str, delimiter) {
    if (!delimiter) {
        delimiter = '.';
    }
    if (str.indexOf(delimiter) === -1) {
        return str;
    }
    return str.substr(0, str.indexOf(delimiter));
}

function isEmptyObject(obj) {
    // because Object.keys(new Date()).length === 0;
    // we have to do some additional check
    return (Object.keys(obj).length === 0 && obj.constructor === Object);
}

function toUtilityMap(data, objectIdentifier) {
    let map = {};
    if (!objectIdentifier) {
        objectIdentifier = 'id';
    }
    if (this.isArray(data)) {
        for (let item of data) {
            if (item[objectIdentifier]) {
                map[item[objectIdentifier]] = item;
            }
        }
    } else if (this.isPlainObject(data)) {
        if (data[objectIdentifier]) {
            map[data[objectIdentifier]] = data;
        }
    }
    return {
        data: map,
        keys: function() {
            return Object.keys(map);
        },
        getItem: function (id) {
            return map[id];
        },
        hasItem: function (id) {
            return map[id] ? true : false;
        },
        hasItemWithProperty: function (id, property) {
            return this.hasProperty(id, property);
        },
        hasItemWithNotNullProperty: function (id, property) {
            let value = this.getProperty(id, property);
            if ((value === undefined) || (value === null)) {
                return false;
            }
            return true;
            //if ((value) || (value === false)) {
            //    return true;
            //}
            //return false;
        },
        hasProperty: function (id, property) {
            if (!this.hasItem(id)) {
                return false;
            }
            return map[id].hasOwnProperty(property) ? true : false;
        },
        getProperty: function (id, property) {
            if (this.hasProperty(id, property)) {
                return map[id][property];
            } else {
                return undefined;
            }
        }
    }
}

function waitUntilConditionMet(conditionalFunction, callback) {
    if(!conditionalFunction()) {
        setTimeout(waitUntilConditionMet.bind(null, conditionalFunction, callback), 100);
    } else {
        callback();
    }
}

function iterateWithDelay(arr, time, callback) {

    return new Promise((resolve, reject) => {

        let i = 0;
        let total = arr.length;
        let lastIndex = total - 1;

        function loop() {

            // callback(arrayItem, arrayIndex, isLast, isFirst);

            if (total === 1) {
                callback(arr[i], i, true, true);
            } else {
                if (i === 0) {
                    callback(arr[i], i, false, true);
                } else if (i === lastIndex) {
                    callback(arr[i], i, true, false);
                } else {
                    callback(arr[i], i, false, false);
                }
            }

            if (i < lastIndex) {
                i++;
            } else {
                resolve();
                return;
            }

            setTimeout(loop, time);

        }

        if (total > 0) {
            loop();
        } else {
            resolve();
        }

    });

}

/*
function iterateWithPromiseAwait(arr, time, callback) {

    async.eachSeries(arr, function (name, callback) {
        this.__attachQueue(name, options).then(() => {
            callback();
        });
    });

}
*/

function retryWithDelayUntilConditionMet(task, time, callback) {

    let counter = 0;
    let conditionMet = false;

    function conditionMetCallback() {
        conditionMet = true;
    }

    return new Promise((resolve, reject) => {

        function loop() {

            counter++;

            let taskResult = task();

            let cbResult = callback(taskResult, counter, conditionMetCallback);

            if ((cbResult) || (conditionMet)) {
                resolve(taskResult);
            } else {
                setTimeout(loop, time);
            }
        }

        loop();

    });

}

function retryAsyncWithDelayUntilConditionMet(task, time, callback) {

    let counter = 0;
    let conditionMet = false;

    function conditionMetCallback() {
        conditionMet = true;
    }

    return new Promise((resolve, reject) => {

        function loop() {

            counter++;

            task().then((taskResult) => {

                let cbResult = callback(taskResult, counter, conditionMetCallback);

                if ((cbResult) || (conditionMet)) {
                    resolve(taskResult);
                } else {
                    setTimeout(loop, time);
                }

            }).catch(e => {

                reject(e);

            });

        }

        loop();

    });

}

function tryParseJson(jsonString){
    try {
        var o = JSON.parse(jsonString);

        // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns null, and typeof null === "object",
        // so we must check for that, too. Thankfully, null is falsey, so this suffices:
        if (o && typeof o === "object") {
            return o;
        }
    } catch (e) { }

    return false;
}

exports.adjustDateForTimezone = adjustDateForTimezone;
exports.toDateTime = toDateTime;

exports.getRandomInt = getRandomInt;

exports.toBoolean = toBoolean;
exports.toArrayString = toArrayString;
exports.getBasePath = getBasePath;
exports.getLastPathValue = getLastPathValue;
exports.getFirstPathValue = getFirstPathValue;

exports.isObject = isObject;
exports.isPlainObject = isPlainObject;
exports.isString = isString;
exports.isBoolean = isBoolean;
exports.isBooleanLike = isBooleanLike;
exports.isFunction = isFunction;
exports.isNumber = isNumber;
exports.isNumberLike = isNumberLike;
exports.isNumberString = isNumberString;
exports.isDate = isDate;
exports.isArray = isArray;
exports.isPrimitiveLike = isPrimitiveLike;
exports.getValueType = getValueType;

exports.isEmptyObject = isEmptyObject;

exports.toUtilityMap = toUtilityMap;

exports.waitUntilConditionMet = waitUntilConditionMet;
exports.iterateWithDelay = iterateWithDelay;
exports.retryWithDelayUntilConditionMet = retryWithDelayUntilConditionMet;
exports.retryAsyncWithDelayUntilConditionMet = retryAsyncWithDelayUntilConditionMet;

exports.tryParseJson = tryParseJson;


class Paginator {

    constructor(data, search, limit) {
        //console.log('Invoking the force, Luke ...');
        this.data = data;
        this.search = search;
        
        this.limit = limit || 10;
        this.currentOffset = 0;

        this.responseTotal;
        this.globalTotal;

        this.currentStartIndex;
        this.currentEndIndex;

        this.currentPageCount;
        this.totalPageCount;

        this.info;
        this.pageInfo;
    }

    bind(bindingContext) {
        this.parent = bindingContext;
    }

    testMe() {
        //console.log('Dont test me');
    }

    get hasPreviousPage() {
        return this.currentOffset < 1 ? false : true;
    }

    get hasNextPage() {
        return this.globalTotal <= this.currentEndIndex ? false : true;
    }

    yebo(fromOffset, searchCriteria) {
        //console.log('yebo : ' + fromOffset);
    }

    loadData(context, fromOffset, searchCriteria) {
        if ((fromOffset === null) || (fromOffset === undefined)) {
            fromOffset = this.currentOffset;
        }

        //console.log('Paginator loading data: Limit to ' + this.limit + ', from offset ' + fromOffset);
        let options = {
            options: {
                limit: this.limit, 
                offset: fromOffset,
                fullCount: true
            }
        }

        try {
            if ((searchCriteria) && (this.search)) {
                this.isInSearchMode = true;
                if (this.currentSearchCriteria) {
                    if (this.currentSearchCriteria !== searchCriteria) {
                        //console.log('Invoking the spell of Mordor. Bwhahahaha!!');
                        options.options.offset = 0;
                    }
                }
                this.currentSearchCriteria = searchCriteria;
                options.options.searchCriteria = searchCriteria;
                return this.search(options).then(response => {
                    this._updateInternalState(response, fromOffset);
                    return Promise.resolve(response);
                }).catch(error => {
                    this.currentOffset = fromOffset;
                    return Promise.reject(error);
                });
            } else {
                if (this.isInSearchMode) {
                    options.options.offset = 0;
                }
                this.isInSearchMode = false;
                this.currentSearchCriteria = null;
                return this.data.call(context, dataItemCount, dataItem).then(response => {
                //return this.data(options).then(response => {
                    this._updateInternalState(response, fromOffset);
                    return Promise.resolve(response);
                }).catch(error => {
                    this.currentOffset = fromOffset;
                    return Promise.reject(error);
                });
            }
        } catch (e) {
            if ((e.message) && (e.message === 'this.data(...) is undefined')) {
                let message = 'The data load implementation for this paginator most likely does not return its result';
                console.log(message);
                return Promise.reject(message + '. ' + e.message);
            } else {
                console.log('Paginator error');
                console.log(e);
                return Promise.reject(e);
            }
        }
    }

    _updateInternalState(response, fromOffset) {
        this.currentOffset = response.content.meta.offset || fromOffset;

        this.responseTotal = response.content.data.length;
        this.globalTotal = response.content.meta.fullCount || 0;

        this.currentStartIndex = this.currentOffset + 1;
        this.currentEndIndex = this.currentStartIndex + this.responseTotal - 1;

        if (this.globalTotal < this.limit) {
            this.totalPageCount = 1;
        } else {
            if (this.globalTotal % this.limit === 0) {
                this.totalPageCount = Math.floor(this.globalTotal / this.limit);
            } else {
                this.totalPageCount = Math.floor(this.globalTotal / this.limit) + 1;
            }
        }

        this.currentPageCount = Math.ceil(this.currentStartIndex / this.limit);

        this.info = this.currentStartIndex + ' to ' + this.currentEndIndex + ' of ' + this.globalTotal + ' records';
        this.pageInfo = this.currentPageCount + ' of ' + this.totalPageCount + ' pages';
    }

    next() {
        var newOffset = Number(this.currentOffset) + Number(this.limit);
        if ((this.isInSearchMode) && (this.currentSearchCriteria)) {
            this.loadData(newOffset, this.currentSearchCriteria);
        } else {
            this.loadData(newOffset);
        }
    }

    previous() {
        var newOffset = Number(this.currentOffset) - Number(this.limit);
        if (newOffset < 0) {
            newOffset = 0;
        }
        if ((this.isInSearchMode) && (this.currentSearchCriteria)) {
            this.loadData(newOffset, this.currentSearchCriteria);
        } else {
            this.loadData(newOffset);
        }
    }

    first() {
        if ((this.isInSearchMode) && (this.currentSearchCriteria)) {
            this.loadData(0, this.currentSearchCriteria);
        } else {
            this.loadData(0);
        }
    }

    last() {
        var newOffset = (this.totalPageCount-1) * this.limit;
        if ((this.isInSearchMode) && (this.currentSearchCriteria)) {
            this.loadData(newOffset, this.currentSearchCriteria);
        } else {
            this.loadData(newOffset);
        }
    }

}

exports.Paginator = Paginator;
exports.instance = function(data, search, limit) {
    return new Paginator(data, search, limit);
};
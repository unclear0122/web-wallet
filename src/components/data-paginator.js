
import { customElement, bindable, inject } from 'aurelia-framework';
import { PaginatorService } from './paginator-service';

@customElement('data-paginator')
@inject(Element, PaginatorService)
export class DataPaginator {

    @bindable name = 'default_paginator';
    @bindable type;
    @bindable fetchData;
    @bindable dataPaged;
    @bindable search;
    @bindable limit = 10;
    @bindable mode = 'expanded';
    @bindable addClasses = null;

    constructor(element, paginatorService) {

        this.element = element;
        this.paginatorService = paginatorService;

        this.currentOffset = 0;

        this.responseTotal;
        this.overallTotal;

        this.currentStartIndex;
        this.currentEndIndex;

        this.currentPageCount;
        this.totalPageCount;

        this.info;
        this.pageInfo;

        this.visible = true;

    }

    bind(bindingContext) {
        this.parent = bindingContext;
        this.paginatorService.register(this.name, this);
        // allDataProvided || fetchDataViaCallback
        //if ((this.type) && (this.type === 'allDataProvided')) {
        //    this.fetchData = this.manuallyPaginateData;
        //}
        //if (!this.manualInit) {
        //    this.loadData(0);
        //}

    }

    attached() {
        //console.log('Paginator Attached');
    }

    get hasPreviousPage() {
        return this.currentOffset < 1 ? false : true;
    }

    get hasNextPage() {
        return this.overallTotal <= this.currentEndIndex ? false : true;
    }

    register() {
        this.paginatorService.register(this.name, this);
    }

    loadData(fromOffset, searchCriteria) {

        if ((fromOffset === null) || (fromOffset === undefined)) {
            fromOffset = this.currentOffset;
        }

        if (!this.limit) {
            this.limit = 10;
        }

        let dataRequestArgs = {
            request: {
                limit: this.limit,
                offset: fromOffset
            }
        }

        try {

            if (searchCriteria) {
                this.isInSearchMode = true;
                if (this.currentSearchCriteria) {
                    if (this.currentSearchCriteria !== searchCriteria) {
                        dataRequestArgs.request.offset = 0;
                        fromOffset = 0;
                    }
                }
                this.currentSearchCriteria = searchCriteria;
                dataRequestArgs.request.searchCriteria = searchCriteria;
            } else {
                if (this.isInSearchMode) {
                    dataRequestArgs.request.offset = 0;
                }
                this.isInSearchMode = false;
                this.currentSearchCriteria = null;
            }

            if (this.fetchData) {
                return this.fetchData(dataRequestArgs).then(response => {
                    this.updateInternalState(response, fromOffset);
                    this.dataPaged({
                        response: {
                            data: response.data,
                            limit: this.limit,
                            offset: this.currentOffset,
                            total: this.overallTotal
                        } 
                    });
                    return response;
                }).catch(error => {
                    this.currentOffset = fromOffset;
                    throw new Error(error);
                });
            } else {
                console.log('Data callback method for paginator "' + this.name + '"not defined');
            }

        } catch (e) {

            if ((e.message) && (e.message === 'this.fetchData(...) is undefined')) {
                let message = 'The data load implementation for this paginator most likely does not return its result';
                console.log(message);
                throw e;
            } else {
                throw e;
            }

        }
    }

    updateInternalState(response, fromOffset) {

        try {

            this.currentOffset = fromOffset;

            this.responseTotal = response.data ? response.data.length : 0;
            this.overallTotal = response.total || 0;

            this.currentStartIndex = this.currentOffset + 1;
            this.currentEndIndex = this.currentStartIndex + this.responseTotal - 1;

            if (this.overallTotal < this.limit) {
                this.totalPageCount = 1;
            } else {
                if (this.overallTotal % this.limit === 0) {
                    this.totalPageCount = Math.floor(this.overallTotal / this.limit);
                } else {
                    this.totalPageCount = Math.floor(this.overallTotal / this.limit) + 1;
                }
            }

            this.currentPageCount = Math.ceil(this.currentStartIndex / this.limit);

            this.info = this.currentStartIndex + ' to ' + this.currentEndIndex + ' of ' + this.overallTotal; // + ' records';
            this.pageInfo = this.currentPageCount + ' of ' + this.totalPageCount; // + ' pages';

        } catch (e) {

            console.log('Failed to update internal paginator state: ' + e);
            console.log('The data load implemenation for this paginator most likely does not return a promise');
            console.log(e);

        }

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

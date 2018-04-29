
import { PaginatorService } from '../components/paginator-service';

import { customElement, bindable, BindingEngine, inject } from 'aurelia-framework';

@customElement('data-table')
@inject(Element, BindingEngine, PaginatorService)
export class DataTable {

    @bindable data;
    @bindable config;
    @bindable fetchData;
    @bindable refreshModel;
    @bindable onItemSelection;
    @bindable selectedItem;
    @bindable selectedItems;
    @bindable visibleData;

    constructor(element, bindingEngine, paginatorService) {

        this.element = element;
        this.bindingEngine = bindingEngine;
        this.paginatorService = paginatorService

        //this.visibleData;
        this.columns;
        this.itemKey;
        this.tableName;

        this.hasPaginator = false;
        this.dataProvided = true;

        this.showHover = false;
        this.showBorder = false;
        this.showStriped = false;

    }

    bind(bindingContext) {

        this.parent = bindingContext;

        if ((this.config) && (this.config.tableName) ) {
            this.tableName = this.config.tableName;
        } else {
            this.tableName = 'table';
        }

        if ((this.config) && (this.config.itemKey) ) {
            this.itemKey = this.config.itemKey;
        } else {
            this.itemKey = 'id';
        }

        if ((this.config) && (this.config.showHover)) {
            this.showHover = this.config.showHover;
        }

        if ((this.config) && (this.config.showBorder)) {
            this.showBorder = this.config.showBorder;
        }

        if ((this.config) && (this.config.showStriped)) {
            this.showStriped = this.config.showStriped;
        }

        if ((this.config) && (this.config.multiSelectScope) && this.config.multiSelectScope === 'value' ) {
            this.multiSelectScope = 'value';
        } else {
            this.multiSelectScope = 'object';
        }

        if ((this.config) && (this.config.columns) ) {
            this.columns = this.config.columns;
        }

        if ((this.config) && (this.config.paginator) && (this.config.paginator.enabled === true )) {

            this.hasPaginator = true;

            if (!this.config.paginator.name) {
                this.config.paginator.name = this.tableName + 'Paginator';
            }

            // dataProvided || dataFetched
            if ((this.config.paginator.type) && (this.config.paginator.type === 'dataFetched')) {
                this.dataProvided = false;
            } else {
                this.dataProvided = true;
                this.config.paginator.type = 'dataProvided';
            }

            if (!this.config.paginator.pageSize) {
                this.config.paginator.pageSize = 10;
            }

        }

        if (!this.fetchData) {
            this.fetchData = this._fetchData;
        }

    }

    attached() {
        //if (!this.dataProvided) && (autoLoad) {
        //    this.paginatorService.getPaginator(this.config.paginator.name).loadData();
        //}
    }

    refreshModelChanged() {
        let d = this.data;
        this.data = null;
        this.data = d;
    }

    dataChanged() {
        // move this into attached ??

        if (!this.hasPaginator) {
            this.visibleData = this.data;
        } else if (this.dataProvided) {
            this.paginatorService.getPaginator(this.config.paginator.name).loadData();
        }
    }

    /*
    dataChanged(newValue, oldValue) {
        //console.log(`The array instance changed.  unsubscribing from the old array's mutation events and subscribing to the new array's mutation events.`);
        this.unsubscribeFromDataMutationObserver();
        if (this.data) {
            this.dataMutationSubscription = this.bindingEngine.collectionObserver(this.data).subscribe(splices => this.dataMutated(splices));
        }
    }

    unsubscribeFromDataMutationObserver() {
        if (this.dataMutationSubscription) {
            this.dataMutationSubscription.dispose();
            this.dataMutationSubscription = null;
        }
    }

    dataMutated(splices) {
        console.log('The contents of the array instance changed');
    }
    */

    itemSelected() {
        var that = this;
        setTimeout(function () {
            //console.log(that.selectedItem);
            //console.log(that.selectedItems);
            //console.log('----------------');
            if (that.onItemSelection) {
                that.onItemSelection();
            }
        }, 200);
    }

    dataPaged(response) {
        this.visibleData = response.data;
    }

    _fetchData(request) {

        if (!request.limit) {
            request.limit = 10;
        }

        if ((request.offset === undefined) || (request.offset === null)) {
            request.offset = 0;
        }

        if (request.searchCriteria) {
            // TODO: handle search criteria if present
        }

        if (this.config.paginator.fetchData) {

            if ((this.parent) && (this.parent[this.config.paginator.fetchData])) {
                return this.parent[this.config.paginator.fetchData](request);
            } else {
                console.log('No fetchData method found named "' + this.config.paginator.fetchData +'"');
            }

        } else {

            let response = {
                data: null,
                total: 0
            }

            if ((this.data) && (this.data.length > 0)) {
                response.data = this.data.slice(request.offset, request.offset + request.limit);
                response.total = this.data.length;
            }

            return Promise.resolve(response);

        }

    }

}

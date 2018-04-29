
import {customElement, bindable, inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';

// import * as resolvePath from 'vendor/object-resolve-path/object-resolve-path.js';
import resolvePath from 'object-resolve-path';


@customElement('data-table-item')
@inject(Element, EventAggregator)
export class DataTableItem {

    @bindable key;
    @bindable item;
    @bindable column;
    @bindable domId;

    constructor(element, eventAggregator) {
        this.element = element;
        this.eventAggregator = eventAggregator;

        this.itemValue = null;
        this.itemValueList = null;

        this.baseItemClass = null;

        this.footerLeftValue = null;
        this.footerRightValue = null;

        this.defaultNoItemsAvailableText = '-';
        this.defaultItemSeparator = ',';

        this.routeKeys = null;
    }

    bind(bindingContext) {
        this.parent = bindingContext;
    }

    attached() {

        if (this.column) {
            this.routeKeys = this.column.route ? Object.keys(this.column.route) : null;
            if (this.column.field) {
                if (this.column.field.indexOf('.') > -1) {
                    this.itemValue = resolvePath(this.item, this.column.field);
                } else {
                    this.itemValue = this.item[this.column.field];
                }
                if (this.item._style) {
                    //this.baseItemClass = resolvePath(this.item, this.item._style);
                    this.baseItemClass = this.item._style;
                }
                /*
                if (this.column.tagField) {
                    if ((this.itemClass === undefined) || (this.itemClass === null)) {
                        this.itemClass = 'blah';
                    }
                    this.itemClass = resolvePath(this.item, this.column.tagField);
                    //console.log(this.item.fullName);
                    //console.log(this.itemClass + ' > ' + this.column.tagField);
                    //console.log(this.column.tagField + ': ' + this.itemClass + ' > ' + this.item[this.column.tagField]);
                }
                */
            } else if (this.column.fieldList) {
                let listValues = null;
                if (!this.column.fieldList.emptyListText) {
                    this.column.fieldList.emptyListText = this.defaultNoItemsAvailableText;
                }
                if (!this.column.fieldList.itemSeparator) {
                    this.column.fieldList.itemSeparator = this.defaultItemSeparator;
                }
                if (this.column.fieldList.field.indexOf('.') > -1) {
                    listValues = resolvePath(this.item, this.column.fieldList.field);
                } else {
                    listValues = this.item[this.column.fieldList.field];
                }
                if ((listValues) && (listValues.constructor === Array)) {
                    this.itemValueList = listValues;
                }
            } else {
                this.itemValue = '';
            }
            if (this.hasFooterLeft) {
                if (this.column.footerLeft.field) {
                    if (this.column.footerLeft.field.indexOf('.') > -1) {
                        this.footerLeftValue = resolvePath(this.item, this.column.footerLeft.field);
                    } else {
                        this.footerLeftValue = this.item[this.column.footerLeft.field];
                    }
                } else {
                    this.footerLeftValue = '';
                }
            }
            if (this.hasFooterRight) {
                if (this.column.footerRight.field) {
                    if (this.column.footerRight.field.indexOf('.') > -1) {
                        this.footerRightValue = resolvePath(this.item, this.column.footerRight.field);
                    } else {
                        this.footerRightValue = this.item[this.column.footerRight.field];
                    }
                } else {
                    this.footerRightValue = '';
                }
            }
        }
    }

    get hasFooter() {
        if ( (this.column.footerLeft) || (this.column.footerRight) ) {
            return true;
        }
        return false;
    }

    get hasFooterLeft() {
        return this.column.footerLeft ? true : false;
    }

    get hasFooterRight() {
        return this.column.footerRight ? true : false;
    }

    get hasTag() {
        return this.column.tagField ? true : false;
    }

    get footerRightTag() {
        if (this.column.footerRight.tagField) {
            return this.item[this.column.footerRight.tagField];
        } else {
            return this.column.footerRight.tag ? this.column.footerRight.tag : '';
        }
    }

    get footerLeftTag() {
        if (this.column.footerLeft.tagField) {
            return this.item[this.column.footerLeft.tagField];
        } else {
            return this.column.footerLeft.tag ? this.column.footerLeft.tag : '';
        }
    }

    get itemClass() {
        if (this.column.tagField) {
            if (this.column.style) {
                return this.column.style + ' ' + this.baseItemClass ? this.baseItemClass + ' ' + resolvePath(this.item, this.column.tagField) : resolvePath(this.item, this.column.tagField);
            } else {
                return this.baseItemClass ? this.baseItemClass + ' ' + resolvePath(this.item, this.column.tagField) : resolvePath(this.item, this.column.tagField);
            }
        } else {
            if (this.column.style) {
                return this.column.style + ' ' + this.baseItemClass;
            } else {
                return this.baseItemClass;
            }
        }
    }

    get hasRoute() {
        if ( (this.column.route) && (this.column.route.to) ) {
            return true;
        }
        return false
    }

    get hasRouteWithoutParams() {
        if ( (this.column.route) && (this.column.route.to) && (this.routeKeys) && (this.routeKeys.length === 1) ) {
            return true;
        }
        return false;
    }

    get hasRouteWithParams() {
        if ( (this.column.route) && (this.routeKeys) && (this.routeKeys.length > 1) ) {
            return true;
        }
        return false;
    }

    get routeParams() {
        let routeParams = {};
        if (this.column.route.id) {
            routeParams.id = this.item[this.column.route.id];
        }
        for (let key of this.routeKeys) {
            if ((key !== 'id') && (key !== 'to') && (this.column.route[key]) ) {
                routeParams[key] = this.column.route[key];
            }
        }
        return routeParams;
    }

    /*
    get hasRouteWithId() {
        if ( (this.column.route) && (this.column.route.to) && (this.column.route.id) ) {
            return true;
        }
        return false
    }

    get hasRouteWithoutId() {
        if ( (this.column.route) && (this.column.route.to) && (!this.column.route.id) ) {
            return true;
        }
        return false
    }
    */

    get hasTrigger() {
        if (this.hasFieldList) {
            if (this.column.fieldList.trigger) {
                return true;
            }
            return false
        } else {
            if (this.column.trigger) {
                return true;
            }
            return false
        }
    }

    get hasFieldList() {
        if ( (this.column.fieldList) && (this.column.fieldList.field) ) {
            return true;
        }
        return false
    }




    get conversionFormat() {
        return this.column.converter.format;
    }

    get hasConverter() {
        if ( (this.column.converter) && (this.column.converter.type) ) {
            return true;
        }
        return false
    }

    get hasDateConverter() {
        if ( (this.column.converter) && (this.column.converter.type) && (this.column.converter.type === 'date') ) {
            return true;
        }
        return false
    }

    get hasBooleanConverter() {
        if ( (this.column.converter) && (this.column.converter.type) && (this.column.converter.type === 'boolean') ) {
            return true;
        }
        return false
    }

    get hasNumberConverter() {
        if ( (this.column.converter) && (this.column.converter.type) &&  (this.column.converter.type === 'number') ) {
            return true;
        }
        return false;
    }

    get hasFileContextConverter() {
        if ( (this.column.converter) && (this.column.converter.type) && (this.column.converter.type === 'fileContext') ) {
            return true;
        }
        return false
    }

    get footerLeftConversionFormat() {
        return this.column.footerLeft.converter.format;
    }

    get footerLeftHasConverter() {
        if ( (this.column.footerLeft) && (this.column.footerLeft.converter) && (this.column.footerLeft.converter.type) ) {
            return true;
        }
        return false
    }

    get footerLeftHasDateConverter() {
        if ( (this.column.footerLeft) && (this.column.footerLeft.converter) && (this.column.footerLeft.converter.type) && (this.column.footerLeft.converter.type === 'date') ) {
            return true;
        }
        return false
    }

    get footerLeftHasBooleanConverter() {
        if ( (this.column.footerLeft) && (this.column.footerLeft.converter) && (this.column.footerLeft.converter.type) && (this.column.footerLeft.converter.type === 'boolean') ) {
            return true;
        }
        return false
    }

    get footerLeftHasNumberConverter() {
        if ( (this.column.footerLeft) && (this.column.footerLeft.converter) && (this.column.footerLeft.converter.type) &&  (this.column.footerLeft.converter.type === 'number') ) {
            return true;
        }
        return false;
    }




    get footerRightConversionFormat() {
        return this.column.footerRight.converter.format;
    }

    get footerRightHasConverter() {
        if ( (this.column.footerRight) && (this.column.footerRight.converter) && (this.column.footerRight.converter.type) ) {
            return true;
        }
        return false
    }

    get footerRightHasDateConverter() {
        if ( (this.column.footerRight) && (this.column.footerRight.converter) && (this.column.footerRight.converter.type) && (this.column.footerRight.converter.type === 'date') ) {
            return true;
        }
        return false
    }

    get footerRightHasBooleanConverter() {
        if ( (this.column.footerRight) && (this.column.footerRight.converter) && (this.column.footerRight.converter.type) && (this.column.footerRight.converter.type === 'boolean') ) {
            return true;
        }
        return false
    }

    get footerRightHasNumberConverter() {
        if ( (this.column.footerRight) && (this.column.footerRight.converter) && (this.column.footerRight.converter.type) &&  (this.column.footerRight.converter.type === 'number') ) {
            return true;
        }
        return false;
    }

    triggerInvoked(triggerConfig, data) {
        if (triggerConfig && triggerConfig.select) {
            //let radioOrCheck = $('#_' + this.item[this.key] + ' input');
            let radioOrCheck = $('#' + this.domId + ' input');
            if (radioOrCheck) {
                radioOrCheck.click();
            }
        } else if (triggerConfig && triggerConfig.event) {
            this.eventAggregator.publish(triggerConfig.event, data);
        }
    }

}

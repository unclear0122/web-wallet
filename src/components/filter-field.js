
import { customElement, bindable } from 'aurelia-framework';

import resolvePath from 'object-resolve-path';

@customElement('filter-field')
export class FilterField {

    @bindable filtered = [];
    @bindable unfiltered = [];

    @bindable filterBy = 'name';

    @bindable buttonText = 'Filter';
    @bindable placeholderText = null;

    @bindable isButtonDisabled = false;

    @bindable groupClasses = null;
    @bindable inputClasses = null;
    @bindable buttonClasses = null;

    constructor() {}

    filterInputChanged(e) {
        var that = this;
        if ((!e.target.value) || (e.target.value == '')) {
            this.filtered = this.unfiltered.slice(0);
        } else {
            this.filtered = this.unfiltered.filter(function (dataElement) {
                let filterableValue = '';

                if (that.filterBy.indexOf(',') > -1) {
                    let filterByFields = that.filterBy.split(',');
                    for (let filterByField of filterByFields) {
                        if (filterByField.indexOf('.') > -1) {
                            filterableValue += resolvePath(dataElement, filterByField);
                        } else {
                            if (dataElement.hasOwnProperty(filterByField)) {
                                filterableValue += dataElement[filterByField]
                            }
                        }
                    }

                } else {

                    if (that.filterBy.indexOf('.') > -1) {
                        filterableValue = resolvePath(dataElement, that.filterBy);
                    } else {
                        if (dataElement.hasOwnProperty(that.filterBy)) {
                            filterableValue = dataElement[that.filterBy]
                        }
                    }

                }

                //if ( (dataElement.hasOwnProperty(that.filterBy)) && (dataElement[that.filterBy].toLowerCase().includes(e.target.value)) ) {
                //    return true;
                //} else {
                //    return false;
                //}

                if ( (filterableValue) && (filterableValue.toLowerCase().includes(e.target.value)) ) {
                    return true;
                } else {
                    return false;
                }
            });
        }
    }

}

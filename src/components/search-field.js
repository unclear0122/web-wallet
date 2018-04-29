
import {customElement, bindable, inject} from 'aurelia-framework';


@customElement('search-field')
@inject(Element)
export class SearchField {

    @bindable data;
    @bindable clear;
    @bindable result = [];
    
    @bindable buttonText = 'Search';
    @bindable inputText = null;
    @bindable addClasses = null;

    constructor(element) {
        this.element = element;
        this.hasPerformedSearch = false;
    }

    searchInputChanged(e) {
        var that = this;
        
        if ((!e.target.value) || (e.target.value == '')) {
            if (this.hasPerformedSearch) {
                this.clear();
            }
        } else if (e.target.value.length < 3) {
            // this.result = null;
        //} else if (e.target.value.length % 2 !== 0) {
        } else {
            this.hasPerformedSearch = true;
            try {
                this.data({ searchCriteria: e.target.value }).then(response => {
                    this.result = response.data;
                }).catch(error => {
                    console.log('Error getting search field data');
                    console.log(error);
                });
            } catch (e) {
                console.log('Search method implementation probably does not return a result');
                console.log(e);
            }
        }
        
    }

}
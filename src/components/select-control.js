
import {customElement, bindable, inject} from 'aurelia-framework';


@customElement('select-control')
@inject(Element)
export class SelectControl {

    @bindable name;

    @bindable options;
    @bindable optionLabelField = 'label';
    @bindable optionValueField = 'value';

    @bindable optionValueInit;
    @bindable optionDataInit;

    @bindable selectionValue;
    @bindable selectionData;
    @bindable onSelection;

    @bindable remoteData;

    @bindable multiple = false;
    @bindable maxSelections = 3;

    @bindable placeholder;
    @bindable addClasses;

    @bindable parentContainer;

    @bindable hideSearch = false;
    @bindable defaultEmptyOption = false;
    @bindable disabled = false;
    @bindable required = false;
    @bindable fixMissingKeys = false;
    @bindable width;

    constructor(element) {

        this.element = element;

        this.sel = null;

        this.dataExists = false;
        this.selectionData = null;
        this.selectionValue = null;
        this.initValueSet = false;
        this.initValueSupplied = false;
        this.optionValueInitInternal = undefined;
        this.optionDataInitInternal = undefined;


        //this.objectMatcher = (a, b) => a[this.optionValueField] === b[this.optionValueField];

    }

    detached() {
        $(this.element).find('select').select2('destroy');
        this.selectionData = null;
        this.selectionValue = null;
    }

    optionDataInitChanged() {
        if ((!this.initValueSupplied) && (this.optionDataInit)) {
            this.optionDataInitInternal = this.optionDataInit
            this.initValueSupplied = true;
            if (!this.remoteData) {
                this._setDefaultSelectionFromInitData();
                this._setRequiredClasses();
            } else {
                this._setDefaultSelectionForRemoteData();
                this._setRequiredClasses();
            }
        }
    }

    optionValueInitChanged() {
        if ((!this.initValueSupplied) && ((this.optionValueInit) || (this.optionValueInit === false))) {
            //console.log('optionValueInitChanged: ' + this.optionValueInit);
            this.optionValueInitInternal = this.optionValueInit;
            this.initValueSupplied = true;
            if (!this.remoteData) {
                this._setDefaultSelectionFromInitData();
                this._setRequiredClasses();
            } else {
                this._setDefaultSelectionForRemoteData();
                this._setRequiredClasses();
            }
        }
    }

    selectionValueChanged() {
        if ((!this.initValueSupplied) && ((this.selectionValue) || (this.selectionValue === false))) {
            //console.log('selectionValueChanged: ' + this.selectionValue);
            this.optionValueInitInternal = this.selectionValue;
            this.initValueSupplied = true;
            if (!this.remoteData) {
                this._setDefaultSelectionFromInitData();
                this._setRequiredClasses();
            } else {
                this._setDefaultSelectionForRemoteData();
                this._setRequiredClasses();
            }
        }
    }

    _setDefaultSelectionFromInitData(el) {
        if (this.initValueSet) {
            //console.log('Value already initialized');
        } else if (!this.initValueSupplied) {
            //console.log('No init value supplied yet');
        //} else if (!this.hasData) {
        //    console.log('Data not yet available to set default by');
        } else if (!this.sel) {
            //console.log('Select not fully initialized yet?');
        } else {

            let optionValue = undefined;
            if (this.optionValueInitInternal || (this.optionValueInitInternal === false)) {
                optionValue = this.optionValueInitInternal;
            } else if (this.optionDataInitInternal) {
                optionValue = this._getIdForOption(this.optionDataInitInternal);
            }
            if (optionValue) {
                this.initValueSet = true;
                this.sel.val(optionValue).trigger("change");
            } else {
                //console.log('try and match by labels');
                let optionText = undefined;
                if (this.optionDataInitInternal) {
                    optionText = this._getTextForOption(this.optionDataInitInternal);
                }
                if (optionText) {
                    var that = this;
                    el = el ? el : $(this.element).find('select');
                    el.find("option").each(function (i, e) {
                        if (e.text === optionText) {
                            if (that.fixMissingKeys) {
                                that.optionDataInitInternal._key = e.value;
                            }
                            this.initValueSet = true;
                            that.sel.val(e.value).trigger("change");
                        }
                    });
                } else {
                    //console.log('No init data');
                    //let initOption = $("<option disabled selected value></option>");
                    //this.sel.append(initOption).trigger('change');
                }
            }

        }
    }

    _setDefaultSelectionForRemoteData() {
        if (this.optionDataInitInternal) {
            let optionValue = this._getIdForOption(this.optionDataInitInternal);
            let optionText = this._getTextForOption(this.optionDataInitInternal);
            if (optionValue) {
                let initOption = $("<option selected></option>").val(optionValue).text(optionText);
                this.sel.append(initOption).trigger('change');
            } else {
                //let initOption = $("<option disabled selected value></option>");
                //this.sel.append(initOption).trigger('change');
            }
        }
    }

    attached() {

        //console.log('Select attached');
        var that = this;
        var el = $(that.element).find('select');

        if (!this.remoteData) {
            let config = {
                //containerCssClass: ':all:', // needs select2.full.js
                //containerCssClass: 'form-control',
                //theme: "bootstrap4",
                placeholder: that.placeholderText,
            }

            if (this.width) {
                config.width = this.width;
            } else {
                config.dropdownAutoWidth = true;
            }

            if (this.isMultipleSelectionEnabled) {
                config.allowClear = true;
                config.maximumSelectionLength = that.maxSelections;
            }

            if (this.shouldHideSearch) {
                config.minimumResultsForSearch = Infinity;
            }

            if (this.parentContainer) {
                config.dropdownParent = $("#"+this.parentContainer); // Do this for z-index issue (select not displaying in modal), or fix in CSS
            }

            this.sel = el.select2(config);

            var dataCheckCycles = 0;
            var checkDataExists = setInterval(function () {
                //console.log('Waiting for data : ' + that.name + ' ... ');
                if ((that.options) && (that.options.length > 0)) {
                    clearInterval(checkDataExists);
                    that.dataExists = true;
                    //console.log('Data now exists');
                    //that._setDefaultSelectionFromInitData(el);
                    //that._setRequiredClasses(el);
                } else if (dataCheckCycles > 100) {
                    console.log('No data received ...');
                    console.log(el);
                    clearInterval(checkDataExists);
                } else {
                    dataCheckCycles++;
                }
            }, 400);

        } else {

            //console.log('Configuring select with remote data');
            this.dataExists = true;

            let config = {
                //containerCssClass: ':all:', // needs select2.full.js
                //containerCssClass: 'form-control',
                //theme: "bootstrap4",
                placeholder: that.placeholderText,
                maximumInputLength: 12,
                dropdownAutoWidth : false,
                ajax: {
                    delay: 250,
                    dataType: 'json',
                    valueField: that.optionValueField,
                    labelField: that.optionLabelField,
                    transport: function (params, success, failure) {
                        if (!params.data.term) {
                            //failure();
                        } else {
                            that.remoteData({ term: params.data.term }).then(response => {
                                success(response);
                            }).catch(error => {
                                failure(error);
                            });
                        }
                    },
                    processResults: that._processAjaxDataCallResults,
                }
                /*
                ajax: {
                    url: 'http://localhost:8000/users',
                    headers: {
                        'Authorization': "eyJhbGciOiJIUzI1 ....",
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    method: "GET",
                    dataType: 'json',
                    delay: 250,
                    data: function (params) {
                        return {
                            search: 'name,surname',
                            like: params.term,
                            //page: params.page
                        };
                    },
                    processResults: that._processAjaxDataCallResults,
                    cache: true
                }
                */
            }

            if (this.width) {
                config.width = this.width;
            } else {
                config.dropdownAutoWidth = true;
            }

            if (this.isMultipleSelectionEnabled) {
                config.allowClear = true;
                config.maximumSelectionLength = that.maxSelections;
            }

            if (this.shouldHideSearch) {
                config.minimumResultsForSearch = Infinity;
            }

            if (this.parentContainer) {
                config.dropdownParent = $("#"+this.parentContainer); // Do this for z-index issue (select not displaying in modal), or fix in CSS
            }

            this.sel = el.select2(config);

            //this._setDefaultSelectionForRemoteData();
            //this._setRequiredClasses(el);

        }

        /*
        sel.on("select2:open", function () {
            $(".select2-search--dropdown .select2-search__field").attr("placeholder", "Yo...");
            //$('input.select2-search__field').attr('placeholder', 'please type something...');
            //$(".select2-search__field").attr("placeholder", "Ja boet...");
        });
        sel.on("select2:close", function () {
            $(".select2-search--dropdown .select2-search__field").attr("placeholder", null);
        });
        */

        this.sel.on("select2:select", (event) => {
            if (event.originalEvent) { return; }

            let currentSelectedVal = this.sel.select2("val");
            let currentSelectedData = this.sel.select2('data');
            //console.log(currentSelectedVal);
            //console.log(currentSelectedData);

            //this.selectionValue = currentSelectedVal; // already set by aurelia binding

            if (that.required) {
                if (currentSelectedVal) {
                    el.next('span').find('span').first().find('span').first().css({ 'border': '1px solid #97cd76' });
                } else {
                    el.next('span').find('span').first().find('span').first().css({ 'border': '1px solid #ed6c63' });
                }
            }

            if (this.remoteData) {

                if (currentSelectedVal.constructor === Array) {
                    this.selectionData = this.sel.select2('data');
                } else {
                    this.selectionData = this.sel.select2('data')[0];
                }

            } else {

                if (currentSelectedVal.constructor === Array) {
                    this.selectionData = [];
                    if (this.options) {
                        for (let selectedVal of currentSelectedVal) {
                            for (let option of this.options) {
                                if (option[this.optionValueField] === selectedVal) {
                                    this.selectionData.push(option);
                                }
                            }
                        }
                    }
                } else {
                    if (this.options) {
                        for (let option of this.options) {
                            if (option[this.optionValueField] === event.params.data.id) {
                                this.selectionData = option;
                                break;
                            }
                        }
                    }
                }

            }

            let changeEvent;
            if (window.CustomEvent) {
                changeEvent = new CustomEvent('change', {
                    detail: {
                        value: event.target.value
                    },
                    bubbles: true
                });
            } else {
                changeEvent = document.createEvent('CustomEvent');
                changeEvent.initCustomEvent('change', true, true, {
                    detail: {
                        value: event.target.value
                    }
                });
            }

            //this.element.dispatchEvent(changeEvent);
            $(el)[0].dispatchEvent(changeEvent);

            if (this.onSelection) {
                let selection = {
                    last: event.params.data.id,
                    value: currentSelectedVal,
                    data: this.selectionData
                }
                this.onSelection({ selection: selection });
            }

        });

        //$('b[role="presentation"]').hide(); // hide the right down arrow, if you want to render your own

    }

    get isMultipleSelectionEnabled() {
        if (!this.multiple) {
            return false;
        }
        if ((this.multiple === 'true') || (this.multiple === true)) {
            return true;
        } else if ((this.multiple === 'false') || (this.multiple === false)) {
            return false;
        }
        return false;
    }

    get shouldHideSearch() {
        if (!this.hideSearch) {
            return false;
        }
        if ((this.hideSearch === 'true') || (this.hideSearch === true)) {
            return true;
        } else if ((this.hideSearch === 'false') || (this.hideSearch === false)) {
            return false;
        }
        return false;
    }

    get addDefaultEmptyOption() {
        if (!this.defaultEmptyOption) {
            return false;
        }
        if ((this.defaultEmptyOption === 'true') || (this.defaultEmptyOption === true)) {
            return true;
        } else if ((this.defaultEmptyOption === 'false') || (this.defaultEmptyOption === false)) {
            return false;
        }
        return false;
    }

    get placeholderText() {
        return this.placeholder ? this.placeholder : 'Select';
    }

    get hasData() {
        return this.dataExists ? true : false;
    }

    get isDisabled() {
        if (this.disabled === true) {
            return true;
        }
        return this.dataExists ? false : true;
    }

    _getTextForOption(option) {
        if ((option[optionLabelField]) && (option[optionLabelField] !== 'null') && (option[optionLabelField] !== 'undefined')) {
            return option[optionLabelField];
        }
        return 'null';
    }

    _getIdForOption(option) {
        if ((option[optionValueField]) && (option[optionValueField] !== 'null') && (option[optionValueField] !== 'undefined')) {
            return option[optionValueField];
        }
        return null;
    }

    _clearSelectionChanged() {
        if (this.sel) {
            this.sel.val(null).trigger("change");
        }
    }

    _processAjaxDataCallResults(response) {
        var that=this;
        var data = response.data.map(function (item) {
            item.id = item[that.ajaxOptions.valueField];
            item.text = item[that.ajaxOptions.labelField];
            return item;
        });

        //that.options = data;

        return {
            results: data
        };
    }

    _setRequiredClasses(el) {
        // let selectElementClassList = el.attr('class').split(/\s+/);
        el = el ? el : $(this.element).find('select');
        if (this.required) {
            // if ((el.hasClass('select2-hidden-accessible')) && (el.hasClass('is-danger'))) {
            if (el.hasClass('select2-hidden-accessible')) {
                if (this.selectionData) {
                    el.next('span').find('span').first().find('span').first().css({ 'border': '1px solid #97cd76' });
                } else {
                    //console.log(this.optionDataInit);
                    if ((this.optionDataInit) && (this.optionDataInit.id || this.optionDataInit._key)) {
                        el.next('span').find('span').first().find('span').first().css({ 'border': '1px solid #97cd76' });
                    } else {
                        el.next('span').find('span').first().find('span').first().css({ 'border': '1px solid #ed6c63' });
                    }
                }
                //el.on('change', function() {
                //    console.log('HERE');
                //    console.log(that.selectionData);
                //});
            }
        } else {
            if ((el.hasClass('select2-hidden-accessible')) && (el.hasClass('is-primary'))) {
                el.next('span').find('span').first().find('span').first().css({ 'border': '1px solid #1fc8db' });
            }
        }
    }

}

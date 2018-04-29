import {
    customAttribute,
    bindingMode,
    DOM,
    inject
  } from 'aurelia-framework';
  
  function getNumber(value) {
    // todo: use numbro
    let number = parseFloat(value);
    return !isNaN(number) && isFinite(value) ? number : NaN;
  }
  
  @customAttribute('number-value', bindingMode.twoWay)
  @inject(DOM.Element)
  export class NumberValue {
    constructor(input) {
      this.input = input;
    }
  
    valueChanged() {
      // synchronize the input element with the bound value
      const number = getNumber(this.value);
      if (isNaN(number)) {
        this.input.value = '';
      } else {
        this.input.value = number.toString(10);
      }
    }
    
    blur = () => {
      // blank input maps to null value
      if (this.input.value === '') {
        this.value = null;
        return;
      }
      // do we have a number?
      const number = getNumber(this.input.value);
      if (isNaN(number)) {
        // no! reset the input.
        this.valueChanged();
      } else {
        // yes! update the binding.
        this.value = number;
      }
    }
    
    bind() {
      this.valueChanged();
      this.input.addEventListener('blur', this.blur);
    }
    
    unbind() {
      this.input.removeEventListener('blur', this.blur);
    }
  }
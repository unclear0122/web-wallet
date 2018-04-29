    

export class BooleanFormatValueConverter {
  
    toView(value, format) {
        if (!format) {
            format = 'Y,N';
        }
        if (format.indexOf(',') === -1) {
            return value;
        }
        return value ? format.split(',')[0] : format.split(',')[1];
    }
}

  
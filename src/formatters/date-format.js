
//import moment from 'moment';

export class DateFormatValueConverter {

    toView(value, format) {
        if (!value) {
            return '-';
        }
        if (!format) {
            // console.log('Assuming default date format of YYYY-MM-DD');
            format = 'YYYY-MM-DD';
        }
        let m = moment(value);
        if (m.year() === 1970) {
            //console.log('Oh dear, got 1970, probably parsing a unix timestamp as a regular one [' + this.value + ']');
            m = moment.unix(value);
        }
        //m = moment.unix(value);
        //if (m.year() > 3000) {
        //    console.log('Year too big, probably parsing a regular timestamp as a unix one [' + this.value + ']');
        //    m = moment(value);
        //}
        return m.format(format);
    }
}


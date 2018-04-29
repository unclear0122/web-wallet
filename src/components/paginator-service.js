


export class PaginatorService {

    constructor() {
        this.registeredPaginators = {};
    }

    register(name, paginator) {
        this.registeredPaginators[name] = paginator;
        //if (!this.isRegistered(name)) {
        //    this.registeredPaginators[name] = paginator;
        //} else {
        //    console.log('Paginator already registered');
        //}
    }

    isRegistered(name) {
        return this.registeredPaginators.hasOwnProperty(name);
    }

    getPaginator(name) {
        return this.registeredPaginators[name] || null;
        /*
        if (this.isRegistered(name)) {
            console.log('... from here');
            return Promise.resolve(this.registeredPaginators[name]);
        } else {
            var that = this;
            return new Promise((resolve, reject) => {
                setTimeout(function () {
                    resolve(that.registeredPaginators[name]);
                }, 200);
            });
            */

        /*
            console.log('... actually, from here');
            var that = this;
            return new Promise((resolve, reject) => {
                var paginatorCheckCycles = 0;
                var checkPaginatorExists = setInterval(function () {
                    console.log('Waiting for paginator ... ');
                    if (that.isRegistered(name)) {
                        clearInterval(checkPaginatorExists);
                        resolve(that.registeredPaginators[name]);
                    } else if (paginatorCheckCycles > 20) {
                        console.log('Paginator check timed out');
                        clearInterval(checkPaginatorExists);
                        reject('Paginator check timed out');
                    } else {
                        paginatorCheckCycles++;
                    }
                }, 300);
            }).catch(error => {
                console.dir(error);
                console.log('I somehow got here');
            });
            */
        //}
    }

}

import { LogManager } from "aurelia-framework";

import nprogress from 'nprogress';


nprogress.configure({
    //easing: 'ease',
    //speed: 500,
    //trickleSpeed: 200,
    showSpinner: false,
    template: '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="loader-wrapper" id="loader-1"><div id="loader"></div></div></div>'
});

// SPINNER CUSTOM template: '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="loader-wrapper" id="loader-1"><div id="loader"></div></div></div>'
// FONT AWESOME SPINNER template: '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div style="font-size:96px; color: #ffc107"><i class="fa fa-spinner fa-pulse "></i></div></div>'
// ORG SPINNER template: '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner">><div class="spinner-icon"></div></div>'

function _showProgress(trickleSpeed, maxTrickleCount, progress) {

    if (!progress) {

        progress = {
            count: 0,
            done: false,
            end: function() {
                this.done = true;
            }
        }

        trickleSpeed = trickleSpeed ? trickleSpeed : 400;
        maxTrickleCount = maxTrickleCount ? maxTrickleCount : 400;

        nprogress.start();

        setTimeout(function () {
            _showProgress(trickleSpeed, maxTrickleCount, progress);
        }, trickleSpeed);

        return progress;

    } else {

        progress.count = progress.count + 1;
        if (progress.done) {
            nprogress.done();
        } else if (progress.count <= maxTrickleCount) {
            nprogress.inc();
            setTimeout(function () {
                _showProgress(trickleSpeed, maxTrickleCount, progress);
            }, trickleSpeed);
        } else {
            //console.log('DONE. Reached max count');
            nprogress.done();
        }

    }

}

let _progress = {
    start: function(trickleSpeed, maxTrickleCount) {
        nprogress.configure({
            showSpinner: false
        });
        return _showProgress(trickleSpeed, maxTrickleCount);
    },
    startWithLoader: function(trickleSpeed, maxTrickleCount) {
        nprogress.configure({
            showSpinner: true,
            template: '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="loader-wrapper" id="loader-1"><div id="loader"></div></div></div>'
        });
        return _showProgress(trickleSpeed, maxTrickleCount);
    }
}

let _log = LogManager.getLogger('app');

let _ui = {
    progress: _progress,
    log: _log
}


export var progress = _progress;
export var logger = _log;
export var UI = _ui;

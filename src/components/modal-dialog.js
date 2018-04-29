
import {customElement, bindable, inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {ModalService} from './modal-service';


@customElement('modal-dialog')
@inject(EventAggregator, ModalService)
export class ModalDialog {

    @bindable name = 'default_modal';
    @bindable title = '';
    @bindable data = {};
    @bindable modalProperties = {};

    constructor(ea, modalService) {
        this.ea = ea;
        this.modalService = modalService;
    }

    bind(bindingContext) {
        this.parent = bindingContext;
    }

    attached() {
        this.modalService.register(this.name, this);
    }

    detached() {}

    configure(modalProperties) {
        if ( (modalProperties) && (modalProperties.title) )  {
            this.title = modalProperties.title;
        }
        if (modalProperties) {
            this.modalProperties = modalProperties;
        }
    }

    get hasViewModel() {
        return (this.modalProperties.viewModel) ? true : false;
    }

    get renderModalButtons() {
        if ( (this.modalProperties.hasOwnProperty('renderModalButtons') && this.modalProperties.renderModalButtons === true) ) {
            return true;
        }
        return false;
    }

    get showConfirm() {
        if (this.modalProperties && this.modalProperties.confirm) {
            if ((this.modalProperties.confirm.hasOwnProperty('show') && (this.modalProperties.confirm.show === false))) {
                return false;
            } else {
                return true;
            }
        } else {
            return false;
        }
    }

    get showCancel() {
        if (this.modalProperties && this.modalProperties.cancel) {
            if ((this.modalProperties.cancel.hasOwnProperty('show') && (this.modalProperties.cancel.show === false))) {
                return false;
            } else {
                return true;
            }
        } else {
            return false;
        }
    }

    get showDeny() {
        if (this.modalProperties && this.modalProperties.deny) {
            if ((this.modalProperties.deny.hasOwnProperty('show') && (this.modalProperties.deny.show === false))) {
                return false;
            } else {
                return true;
            }
        } else {
            return false;
        }
    }

    open(modalProperties, title, data) {
        if (modalProperties) {
            this.configure(modalProperties);
        }
        if (title) {
            this.title = title;
        }
        if (data) {
            this.data = data;
        }
        //$(`#${this.name}`).toggleClass('is-active');
        $(`#${this.name}`).modal({ keyboard: true, backdrop: 'static' });
        // $(`#${this.name}`).modal();
    }

    close() {
        $(`#${this.name}`).modal('hide');
        //this.cleanup();
    }

    confirm() {
        if ((this.modalProperties.confirm) && (this.modalProperties.confirm.hasOwnProperty('call'))) {
            if ((this.childViewModel) && (this.childViewModel.currentViewModel[this.modalProperties.confirm.call])) {
                this.childViewModel.currentViewModel[this.modalProperties.confirm.call]();
            } else if (this.parent[this.modalProperties.confirm.call]) {
                this.parent[this.modalProperties.confirm.call]();
            }
        } else if ((this.modalProperties.confirm) && (this.modalProperties.confirm.hasOwnProperty('event'))) {
            this.ea.publish(this.modalProperties.confirm.event, {});
        } else {
            this.close();
        }
    }

    deny() {
        if ((this.modalProperties.deny) && (this.modalProperties.deny.hasOwnProperty('call'))) {
            if ((this.childViewModel) && (this.childViewModel.currentViewModel[this.modalProperties.deny.call])) {
                this.childViewModel.currentViewModel[this.modalProperties.deny.call]();
            } else if (this.parent[this.modalProperties.deny.call]) {
                this.parent[this.modalProperties.deny.call]();
            }
        } else if ((this.modalProperties.deny) && (this.modalProperties.deny.hasOwnProperty('event'))) {
            this.ea.publish(this.modalProperties.deny.event, {});
        } else {
            this.close();
        }
    }

    cancel() {
        if ((this.modalProperties.cancel) && (this.modalProperties.cancel.hasOwnProperty('call'))) {

            if ((this.childViewModel) && (this.childViewModel.currentViewModel[this.modalProperties.cancel.call])) {
                this.childViewModel.currentViewModel[this.modalProperties.cancel.call]();
            } else if (this.parent[this.modalProperties.cancel.call]) {
                this.parent[this.modalProperties.cancel.call]();
            }
        } else if ((this.modalProperties.cancel) && (this.modalProperties.cancel.hasOwnProperty('event'))) {
            this.ea.publish(this.modalProperties.cancel.event, {});
        } else {
            this.close();
        }
    }

}

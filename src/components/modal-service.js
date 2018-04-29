


export class ModalService {

    constructor() {
        this.registeredModals = {};
    }

    register(name, modal) {
        this.registeredModals[name] = modal;
    }

    getModal(name) {
        return this.registeredModals[name] || null;
    }

}
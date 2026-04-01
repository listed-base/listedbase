import { createReactive } from "@listedbase/uni-reactive";

export class BaseList<TOutput> {
    protected state = createReactive<TOutput[]>();
    protected schema!: any;
    constructor() {
        this.state.init([]);
    }

    items = this.state.value


}
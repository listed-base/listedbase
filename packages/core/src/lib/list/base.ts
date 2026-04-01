import { createReactive } from "@listedbase/uni-reactive";
import { z, ZodObject, ZodRawShape } from "zod/v4";

export class BaseList<TOutput, TShap extends ZodRawShape> {
    protected state = createReactive<TOutput[]>();
    protected schema!: any;
    constructor() {
        this.state.init([]);
    }

    items = this.state.value


}
import { z } from "zod/v4";
import { BaseList } from "./base";

export class ListItemsImpl<TOutput, S extends z.ZodObject> extends BaseList<TOutput, S> {
    constructor() {
        super();
    }
    get items() {
        return this.state.value
    }
}     

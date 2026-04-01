import { z, ZodRawShape } from "zod/v4";
import { BaseList } from "./base";

export class ListItemsImpl<TOutput, TShape extends ZodRawShape> extends BaseList<TOutput, TShape> {
    constructor() {
        super();
    }
   
}     

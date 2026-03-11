import { createReactive } from "@listedbase/uni-reactive";
import { z } from "zod/v4";
import { SchemaRef } from "../schema/schema";

export class BaseList<TOutput, S extends z.ZodObject> {
    protected state = createReactive<TOutput[]>();
    protected schema!: SchemaRef<S>;
    constructor() {
        this.state.init([]);
    }

}
import { SchemaRef } from '../schema/schema';
import { z } from 'zod/v4';
import { CreateInput, ListMutationsImpl, UpdateInput } from './mutation';
import { TReadonlyState } from '@listedbase/uni-reactive';
import { LFilterInput } from '../filters/types';
export interface ListRef<TOutput, TInput, S extends z.ZodObject> {
    items: TReadonlyState<TOutput[]>;
    findUnique: (where: Partial<TOutput>) => TOutput | undefined;
    findFirst: (options?: LFilterInput<TOutput>) => TOutput | undefined;
    findMany: (options?: LFilterInput<TOutput>) => TOutput[];
    create: (data: CreateInput<TInput>) => TOutput;
    update: (where: LFilterInput<TOutput>, data: UpdateInput<TInput>) => TOutput | undefined;
    upsert: (data: UpdateInput<TInput>) => void;
    delete: (where: LFilterInput<TOutput>) => boolean;
}

export class ListImpl<TOutput, TInput, S extends z.ZodObject> extends ListMutationsImpl<TOutput, TInput, S>
    implements ListRef<TOutput, TInput, S> {
    constructor(schema: SchemaRef<S>) {
        super();
        this.schema = schema;
    }
}



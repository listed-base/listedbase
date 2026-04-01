import { z, ZodObject, ZodRawShape } from 'zod/v4';
import { CreateInput, ListMutationsImpl, UpdateInput } from './mutation';
import { TReadonlyState } from '@listedbase/uni-reactive';
import { LFilterInput } from '../filters/types';
import { SchemaRef } from '../schema/schema';
export interface ListRef<TOutput, TInput> {
    items: TReadonlyState<TOutput[]>;
    findUnique: (where: Partial<TOutput>) => TOutput | undefined;
    findFirst: (options?: LFilterInput<TOutput>) => TOutput | undefined;
    findMany: (options?: LFilterInput<TOutput>) => TOutput[];
    create: (data: CreateInput<TInput>) => TOutput;
    update: (where: LFilterInput<TOutput>, data: UpdateInput<TInput>) => TOutput | undefined;
    upsert: (data: UpdateInput<TInput>) => void;
    delete: (where: LFilterInput<TOutput>) => boolean;
}

export class ListImpl<TOutput, TInput, TShape extends ZodRawShape> extends ListMutationsImpl<TOutput, TInput, TShape>
    implements ListRef<TOutput, TInput> {
    constructor(schema: SchemaRef<TShape>) {
        super();
        this.schema = schema;
    }
    
}



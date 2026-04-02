import { z, ZodObject, ZodRawShape } from 'zod/v4';
import { CreateInput, ListMutationsImpl, UpdateInput } from './mutation';
import { TReadonlyState } from '@listedbase/uni-reactive';
import { LFilterInput } from '../filters/types';
import { TSchemaRefSchemaRef } from '../schema/schema';
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





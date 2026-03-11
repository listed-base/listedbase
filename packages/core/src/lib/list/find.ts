import { z } from "zod/v4";
import { LFilterInput } from "../filters/types";
import { ListItemsImpl } from "./items";


export class FindImpl<TOutput, S extends z.ZodObject>
    extends ListItemsImpl<TOutput, S> {
    findUnique = (where: Partial<TOutput>): TOutput | undefined => {
        console.log(where);

        return undefined
    };

    findFirst = (options?: LFilterInput<TOutput> | undefined): TOutput | undefined => {
        console.log(options);
        this.matchesFilter({} as TOutput, options as LFilterInput<TOutput>);
        return undefined
    };

    findMany = (options?: LFilterInput<TOutput> | undefined): TOutput[] => {
        console.log(options);
        return undefined as unknown as TOutput[]
    };

    private matchesFilter(item: TOutput, filter: LFilterInput<TOutput>): boolean {
        return Object.entries(filter).every(([key, value]) =>
            (item as Record<string, unknown>)[key] === value
        );
    }
}
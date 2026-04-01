import { lField, lSchema, list } from '@listedbase/core';
import { z } from 'zod/v4';
import { sUser } from './user';

export const sPosts = lSchema({
    name: "posts",
    fields: {
        id: lField.id.autouuid(),
        obj: lField.strictObject({ one: z.string() }),
        user: () => lField.oneFrom(sUser)
    }
})


const post = list(sPosts)


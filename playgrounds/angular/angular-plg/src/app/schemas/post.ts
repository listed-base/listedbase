import { lField, lSchema, list } from '@listedbase/core';
import { z } from 'zod/v4';
import { sUser } from './user';
import { LItem } from 'packages/core/src/lib/schema/typing/main';

export const sPosts = lSchema({
    name: "posts",
    fields: {
        id: lField.id.autouuid(),
        obj: lField.strictObject({ one: lF.string() }),
        user: () => lField.oneFrom(sUser)
    }
})


const post = list(sPosts)

export type Post = LItem<typeof sPosts>
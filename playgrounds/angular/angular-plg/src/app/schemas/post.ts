import { Post } from './post';
import { lField, lSchema, list } from '@listedbase/core';
import { sUser } from './user';
import { LItem } from 'packages/core/src/lib/schema/typing/main';

export const sPosts = lSchema({
    name: "posts",
    fields: {
        id: lField.id.autouuid(),
        obj: lField.strictObject({ one: lField.string() }),
        user: () => lField.oneFrom(sUser)
    }
})


const post = list(sPosts)
Post
export type Post = LItem<typeof sPosts>
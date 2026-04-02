import { type LItem, lField, lSchema, list } from '@listedbase/core';
import { sUser } from './user';

export const sPosts = lSchema({
    name: "posts",
    fields: {
        id: lField.id.autouuid(),
        obj: lField.strictObject({ one: lField.string() }),
        user: () => lField.oneFrom(sUser)
    }
})


export const post = list(sPosts)

const user = post.findMany({pick: { user: true }})
user

export type Post = LItem<typeof sPosts>
import {  lField, lSchema, list } from '@listedbase/core';
import type {  LEntrieItem, LWhere} from '@listedbase/core';
import { sUser } from './user';

export const sPosts = lSchema({
  name: 'posts',
  fields: {
    id: lField.id.autouuid(),
    obj: lField.strictObject({ one: lField.string() }),
    user: () => lField.oneFrom(sUser),
  },
});

export const post = list(sPosts);

const user = post.findMany({ omit: { user: true } });

export type Post = LEntrieItem<typeof sPosts>;

export type wPost = LWhere<typeof sPosts>;

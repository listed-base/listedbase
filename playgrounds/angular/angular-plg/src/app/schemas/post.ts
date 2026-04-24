import { lField, LInfer, lSchema } from '@listedbase/core';
import { sUser } from './user';
const sTag = lSchema({
  name: 'tags',
  fields: {
    id: lField.id.autouuid(),
    name: lField.string(),
  },
});
export const sPosts = lSchema({
  name: 'posts',
  fields: {
    id: lField.id.autouuid(),
    no: lField.number().unique(),
    title: lField.string().index(),
    content: lField.string(),
    paid: lField.boolean(),
    published: lField.boolean(),
    createdAt: lField.now(),
    updatedAt: lField.updatedAt(),
    views: lField.number(),
    author: () => lField.oneFrom(sUser),
    tags: () => lField.manyFrom(sTag),
  },
});


type PostInfers = LInfer<typeof sPosts>;


export type Post = PostInfers["base"] & PostInfers["populations"] 
export type PostCreateInput = PostInfers["createInput"]
export type PostUpdateInput = PostInfers["updateInput"]
export type PostUpsertInput = PostInfers["upsertInput"]
export type Where = PostInfers["whereArgs"]









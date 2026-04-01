import { lField, lSchema } from "@listedbase/core";
import { sPosts } from "./post";

export const sUser = lSchema({
  name: "users",
  fields: {
    id: lField.id.autouuid(),
    createdAt: lField.now(),
    updatedAt: lField.updatedAt(),
    name: lField.string().index(),
    email: lField.string().unique(),
    posts: () => lField.manyFrom(sPosts)
  }
})
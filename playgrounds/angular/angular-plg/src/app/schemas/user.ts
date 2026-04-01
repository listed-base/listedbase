import { lField, lSchema } from "@listedbase/core";
import { z } from "zod/v4";
import { sPosts } from "./post";

export const sUser = lSchema({
  name: "users",
  fields: {
    id: lField.id.autouuid(),
    createdAt: lField.now(),
    updatedAt: lField.updatedAt(),
    name: lField.index(z.string()),
    email: lField.unique(z.email()),
    posts: () => lField.manyFrom(sPosts)
  }
})
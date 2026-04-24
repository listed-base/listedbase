import {  lField, lSchema } from "@listedbase/core";

export const sUser = lSchema({
  name: "users",
  fields: {
    id: lField.id.autouuid(),
    name: lField.string().index(),
    email: lField.string().unique(),
  }
})

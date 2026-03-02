import { z, ZodRawShape } from "zod/v4";
import { lField } from "./field";
interface LSchemaOptions<TShape extends ZodRawShape> {
  name: string;
  fields: TShape;
}

type HasAuto<T> = Extract<T, { __auto: true }> extends never ? false : true;

type OmitMarkedAutoFields<T> = {
  [K in keyof T as HasAuto<T[K]> extends true ? never : K]: T[K]
};
export type SchemaRef<S extends z.ZodTypeAny> = {
  name: string;
  schema: S;
  jsonSchema: z.core.ZodStandardJSONSchemaPayload<S>; 
};



export function lSchema<
TShape extends ZodRawShape
>(
  {name, fields}: LSchemaOptions<TShape>): SchemaRef<z.ZodObject<TShape>> {
  const schema = z.object(fields);

  return {
      name,
      schema,
      jsonSchema: z.toJSONSchema(schema),
  };
}



const userSchema = lSchema({
  name: "User",
  fields: {
    id: lField.id.autouuid(),
    name: z.string(),
    age: z.number().optional(),
  },
});
type User = z.output<typeof userSchema.schema>;

type UserInput = OmitMarkedAutoFields<z.input<typeof userSchema.schema>>; 

const userInput: UserInput = {
  name: "Alice",
  age: 30,
};






function listFactory<S extends z.ZodObject>(ref: SchemaRef<S>) {
  type Item = z.output<S>;
  type ItemInput = z.input<S>;

  const parseItem = (v: unknown): Item => ref.schema.parse(v);

  return {
    items: [] as Item[],
    parseItem,
    create(input: ItemInput): Item {
      // if you want defaults/transforms applied, parse is a good “constructor”
      return ref.schema.parse(input);
    },
  };
}





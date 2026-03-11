import { z, ZodRawShape } from "zod/v4";
interface LSchemaOptions<TShape extends ZodRawShape> {
  name: string;
  fields: TShape;
}



export type SchemaRef<S extends z.ZodTypeAny> = {
  name: string;
  schema: S;

};



export function lSchema<
  TShape extends ZodRawShape
>(
  { name, fields }: LSchemaOptions<TShape>): SchemaRef<z.ZodObject<TShape>> {
  const schema = z.object(fields);
  const json = z.toJSONSchema(schema, {
    unrepresentable: "any"
  });

  console.log(flattenAnyOfFirst(json));

  return {
    name,
    schema,
  };
}

function flattenAnyOfFirst(schema: any) {
  if (!schema || typeof schema !== "object") return schema;

  // If this node is an anyOf wrapper, replace it with anyOf[0]
  if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    return flattenAnyOfFirst(schema.anyOf[0]);
  }

  // Recurse common JSON Schema containers
  if (schema.properties && typeof schema.properties === "object") {
    for (const key of Object.keys(schema.properties)) {
      schema.properties[key] = flattenAnyOfFirst(schema.properties[key]);
    }
  }

  if (schema.items) {
    schema.items = flattenAnyOfFirst(schema.items);
  }

  if (schema.$defs && typeof schema.$defs === "object") {
    for (const key of Object.keys(schema.$defs)) {
      schema.$defs[key] = flattenAnyOfFirst(schema.$defs[key]);
    }
  }

  return schema;
}

// usage
// const jsonSchema = z.toJSONSchema(myZodSchema);

// if you only want the specific one-liner behavior for properties:
// for (const key of Object.keys(jsonSchema.properties ?? {})) {
//   const prop = jsonSchema.properties[key];
//   if (prop?.anyOf?.[0]) jsonSchema.properties[key] = prop.anyOf[0];
// }

// const userSchema = lSchema({
//   name: "User",
//   fields: {
//     id: lField.id.autouuid(),
//     name: z.string(),
//     age: z.number().optional(),
//   },
// });
// type User = z.output<typeof userSchema.schema>;

// type UserInput = OmitMarkedAutoFields<z.input<typeof userSchema.schema>>; 

// const userInput: UserInput = {
//   name: "Alice",
//   age: 30,
// };






// function listFactory<S extends z.ZodObject>(ref: SchemaRef<S>) {
//   type Item = z.output<S>;
//   type ItemInput = z.input<S>;

//   const parseItem = (v: unknown): Item => ref.schema.parse(v);

//   return {
//     items: [] as Item[],
//     parseItem,
//     create(input: ItemInput): Item {
//       // if you want defaults/transforms applied, parse is a good “constructor”
//       return ref.schema.parse(input);
//     },
//   };
// }





import { object, z, ZodAny, ZodObject, ZodRawShape } from "zod/v4";

// export const lRef = <TShape extends ZodRawShape>(fn: SchemaRef<TShape>) => fn
// interface LSchemaOptions<TShape extends ZodRawShape> {
//   name: string;
//   fields: () => ZodType | ZodType;
// }

export type LField =
  | z.ZodTypeAny
  | (() => z.ZodTypeAny);

export type LRawShape = Record<string, LField>;

export class SchemaRef<TShape extends ZodRawShape> {
  schema: ZodObject<TShape>
  constructor(public name: string,
    public fields: TShape) {
    this.schema = z.object(fields)
  }
}
// export function lSchema<TShape extends ZodRawShape>(
//   { name, fields }: LSchemaOptions<TShape>
// ): z.ZodObject<TShape> {

//   const schema = z.lazy(() => z.object(fields)).meta({ name }) as unknown as z.ZodObject<TShape>;

//   return schema
// }


type FieldFactory<T extends ZodAny> =
  | T
  | (() => T)

type UnwrapField<T> =
  T extends () => infer R
  ? R
  : T;

type ResolveShape<T extends LRawShape> = {
  [K in keyof T]: UnwrapField<T[K]>;
};

function resolveShape<T extends LRawShape>(
  shape: T
): ResolveShape<T> {

  const resolved: Record<string, z.ZodTypeAny> = {};

  for (const key in shape) {

    const value = shape[key];

    resolved[key] =
      typeof value === "function"
        ? value()
        : value;
  }

  return resolved as ResolveShape<T>;
}
export type TSchemaMap<S extends z.ZodObject> = Map<string, S>
 const schemaRegistry = <S extends z.ZodObject>(): TSchemaMap<S> => new Map<string, S>();

export class LSchema<TShape extends LRawShape = LRawShape> {

  private resolved: ResolveShape<TShape>
  public schema: z.ZodObject

  constructor(
    public name: string,
    public fields: TShape
  ) {
    this.resolved = resolveShape(fields);
    this.schema = z.object(this.resolved)
  }



}
export function lSchema<TShape extends LRawShape>(
  name: string,
  fields: TShape
) {

  const resolved = resolveShape(fields);

  const schema = z.object(resolved).meta({ name });
  schemaRegistry().set(name, schema)

  return schema;
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
  const indexesFields = []
  const uniqueFileds = []
  if (schema.properties && typeof schema.properties === "object") {
    for (const key of Object.keys(schema.properties)) {
      if (schema.properties[key]["indexe"]) indexesFields.push(key)
      if (schema.properties[key]["unique"]) uniqueFileds.push(key)
      if (schema.properties[key]["idField"])
        schema["idField"] = key
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





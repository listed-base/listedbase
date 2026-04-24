// ── شكل الـ JSON Schema property ─────────────────────────────

export interface JSONSchemaProperty {
  // standard JSON Schema
  type?:
    | 'string'
    | 'number'
    | 'boolean'
    | 'integer'
    | 'array'
    | 'object'
    | 'null';
  format?: string;
  anyOf?: JSONSchemaProperty[];
  oneOf?: JSONSchemaProperty[];
  items?: JSONSchemaProperty;
  $ref?: string; // relation — اسم الـ schema المرتبط

  // custom meta — مخزّنة عبر .meta() في lField
  autogen?: boolean; // createdAt, updatedAt, id
  autoIncrement?: boolean;
  idField?: boolean; // الـ primary key
  now?: boolean; // lField.now()
  updatedAt?: boolean; // lField.updatedAt()
  unique?: boolean; // lField.unique()
  index?: boolean; // lField.index()
  default?: unknown;
}

export interface JSONSchemaObject {
  id: string; // اسم الـ store — من z.globalRegistry id
  type: 'object';
  name?: string; // اسم الـ store (من lSchema name)
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties: boolean;
}

// output من z.toJSONSchema(z.globalRegistry)
export interface GlobalRegistryOutput {
  schemas: Record<string, JSONSchemaObject>;
}

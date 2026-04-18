type InferEntity<T> =
  // base fields
  & MappingSchema<T>['base']

  // relations
  & {
    [K in keyof MappingSchema<T>['populateQraph']]:
      MappingSchema<T>['populateQraph'][K] extends Array<infer U>
        ? InferEntity<U>[]
        : InferEntity<MappingSchema<T>['populateQraph'][K]>
  };
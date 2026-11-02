

export interface LDriverCapabilities {
  schema: boolean;
  cursors: boolean;
  fullTextSearch: boolean;
  population: boolean;
  timestampGeneration: boolean;
  updatedAt: boolean;
  subscription: boolean;
  nativeConstraints: boolean;
  transactions: boolean;
  idGeneration: boolean;
  returning: boolean;
  batch: boolean;
  upsert: boolean;
}

export interface FindManyOptions {
  where?: any;
  sort?: any;
  take?: number;
  cursor?: string;
}

export interface FindManyResult<T = any> {
  items: T[];
  nextCursor?: string | null;
}

export interface IDataDriver {
  readonly capabilities: LDriverCapabilities;
  serializeId(id: unknown): string;
  deserializeId(id: string): unknown;
  ensureReady(schemas: any): Promise<void>;
  create(list: string, input: any): Promise<any>;
  update(list: string, where: any, input: any): Promise<any>;
  delete(list: string, where: any): Promise<any>;
  findUnique(list: string, where: any): Promise<any>;
  findMany(list: string, options: FindManyOptions): Promise<FindManyResult>;
  count(list: string, where?: any): Promise<number>;
}

export interface IFilesDriver {
  put(
    path: string,
    file: Blob | Uint8Array,
    options?: any
  ): Promise<{ path: string; url?: string }>;
  get(path: string): Promise<Blob | Uint8Array>;
  remove(path: string): Promise<void>;
  getUrl(path: string): Promise<string>;
}

export type LSourceRole = 'primary' | 'replica';

export interface LSourceDefinition {
  data: IDataDriver;
  files?: IFilesDriver;
}

export interface LSourcesConfig {
  primary: LSourceDefinition;
  replica?: LSourceDefinition;
}

export abstract class LDataDriver implements IDataDriver {
  abstract readonly capabilities: LDriverCapabilities;
  private _readyPromise: Promise<void> | null = null;
  private _isReady = false;

  async ensureReady(schemas: any): Promise<void> {
    if (this._isReady) return;
    if (!this._readyPromise) {
      this._readyPromise = this._init(schemas)
        .then(() => {
          this._isReady = true;
        })
        .catch((err) => {
          this._readyPromise = null;
          throw err;
        });
    }
    return this._readyPromise;
  }

  protected abstract _init(schemas: any): Promise<void>;

  serializeId(id: unknown): string {
    return String(id);
  }

  deserializeId(id: string): unknown {
    return id;
  }

  async create(list: string, input: any): Promise<any> {
    await this.ensureReady(null);
    return this._create(list, input);
  }

  async update(list: string, where: any, input: any): Promise<any> {
    await this.ensureReady(null);
    return this._update(list, where, input);
  }

  async delete(list: string, where: any): Promise<any> {
    await this.ensureReady(null);
    return this._delete(list, where);
  }

  async findUnique(list: string, where: any): Promise<any> {
    await this.ensureReady(null);
    return this._findUnique(list, where);
  }

  async findMany(list: string, options: FindManyOptions): Promise<FindManyResult> {
    await this.ensureReady(null);
    return this._findMany(list, options);
  }

  async count(list: string, where?: any): Promise<number> {
    await this.ensureReady(null);
    return this._count(list, where);
  }

  protected abstract _create(list: string, input: any): Promise<any>;
  protected abstract _update(list: string, where: any, input: any): Promise<any>;
  protected abstract _delete(list: string, where: any): Promise<any>;
  protected abstract _findUnique(list: string, where: any): Promise<any>;
  protected abstract _findMany(list: string, options: FindManyOptions): Promise<FindManyResult>;
  protected abstract _count(list: string, where?: any): Promise<number>;
}

let sourcesConfig: LSourcesConfig | null = null;
export function registerSources(config: LSourcesConfig): void {
  if (sourcesConfig) {
    throw new Error('[OP/INVALID]: Sources have already been registered. Duplicate registration is forbidden.'
    );
  }

  if (!config || !config.primary || !config.primary.data) {
    throw new Error('[VALIDATION/REQUIRED]: Primary data source is required in LSourcesConfig.');
  }

  if (config.replica && config.primary.data === config.replica.data) {
    throw new Error('[OP/INVALID]: Primary and Replica cannot use the exact same IDataDriver instance.');
     
  }

  sourcesConfig = config;
}

export function getPrimarySource(): LSourceDefinition {
  if (!sourcesConfig) {
    throw new Error('[DRIVER/CONNECTION]: No sources registered. Call lSetting.sources(...) first.');
  }
  return sourcesConfig.primary;
}

export function getReplicaSource(): LSourceDefinition | undefined {
  return sourcesConfig?.replica;
}

export function clearSourcesForTesting(): void {
  sourcesConfig = null;
}

import { ZodObject } from 'zod/v4';
import { createReactive } from '@listedbase/uni-reactive';
import { LList } from '../list/api';
import { toLError } from '../list/mutations/runtime/errors';
import { LError } from '../error';
import {
  QueryManyArgs,
  StatusSelection,
  SelectedStatus,
  LQueryManyInstance,
  LQueryIdsInstance,
  LQuerySingleInstance,
  LQueryFunction,
} from './types';

export * from './types';

function createStatusManager(
  executeCount: () => Promise<number>,
  initialError: LError | null,
  initialLoading: boolean
) {
  let countReactive: any = null;
  let errorReactive: any = null;
  let loadingReactive: any = null;
  let refreshingReactive: any = null;

  let countValue = 0;
  let errorValue: LError | null = initialError;
  let loadingValue = initialLoading;
  let refreshingValue = false;

  let isCountTracking = false;

  const initCount = async () => {
    if (!countReactive) {
      countReactive = createReactive<number>();
      countReactive.init(countValue);
    }
    isCountTracking = true;
    try {
      countValue = await executeCount();
      countReactive.modify(() => countValue);
    } catch {
      // ignore count failure
    }
  };

  const unwrapReactive = (r: any, getFallback: () => any) => () => {
    if (!r) return getFallback();
    const val = typeof r.value === 'function' ? (r.value as any)() : r.value;
    return val !== undefined ? val : getFallback();
  };

  const getCountReactive = () => {
    if (!countReactive) {
      void initCount();
    }
    return unwrapReactive(countReactive, () => countValue);
  };

  const getErrorReactive = () => {
    if (!errorReactive) {
      errorReactive = createReactive<LError | null>();
      errorReactive.init(errorValue);
    }
    return unwrapReactive(errorReactive, () => errorValue);
  };

  const getLoadingReactive = () => {
    if (!loadingReactive) {
      loadingReactive = createReactive<boolean>();
      loadingReactive.init(loadingValue);
    }
    return unwrapReactive(loadingReactive, () => loadingValue);
  };

  const getRefreshingReactive = () => {
    if (!refreshingReactive) {
      refreshingReactive = createReactive<boolean>();
      refreshingReactive.init(refreshingValue);
    }
    return unwrapReactive(refreshingReactive, () => refreshingValue);
  };

  const selectionCache = new Map<string, any>();

  return {
    notifyStart(isInitial: boolean) {
      if (isInitial) {
        loadingValue = true;
        refreshingValue = false;
        if (loadingReactive) loadingReactive.modify(() => true);
        if (refreshingReactive) refreshingReactive.modify(() => false);
      } else {
        refreshingValue = true;
        if (refreshingReactive) refreshingReactive.modify(() => true);
      }
    },
    async notifySuccess() {
      loadingValue = false;
      refreshingValue = false;
      errorValue = null;
      if (loadingReactive) loadingReactive.modify(() => false);
      if (refreshingReactive) refreshingReactive.modify(() => false);
      if (errorReactive) errorReactive.modify(() => null);

      if (isCountTracking) {
        try {
          countValue = await executeCount();
          if (countReactive) countReactive.modify(() => countValue);
        } catch {}
      }
    },
    notifyError(err: LError) {
      loadingValue = false;
      refreshingValue = false;
      errorValue = err;
      if (loadingReactive) loadingReactive.modify(() => false);
      if (refreshingReactive) refreshingReactive.modify(() => false);
      if (errorReactive) errorReactive.modify(() => err);
    },
    select<Sel extends StatusSelection>(selection?: Sel): SelectedStatus<Sel> {
      const key = JSON.stringify(selection || {});
      if (selectionCache.has(key)) {
        return selectionCache.get(key);
      }

      const res: any = {};
      if (selection?.count) {
        res.count = getCountReactive();
      }
      if (selection?.error) {
        res.error = getErrorReactive();
      }
      if (selection?.loading) {
        res.loading = getLoadingReactive();
      }
      if (selection?.refreshing) {
        res.refreshing = getRefreshingReactive();
      }

      selectionCache.set(key, res);
      return res as SelectedStatus<Sel>;
    },
  };
}

export const lQuery: LQueryFunction = ((list: LList<any>, argsOrIds: any = {}): any => {
  const isIds = Array.isArray(argsOrIds);

  if (isIds) {
    return createIdsQuery(list, argsOrIds);
  }

  return createManyQuery(list, argsOrIds);
}) as any;

lQuery.single = <S extends ZodObject<any>>(
  list: LList<S>,
  args: { where: any }
): LQuerySingleInstance<S> => {
  return createSingleQuery(list, args);
};

// -------------------------------------------------------------
// Many Query Implementation
// -------------------------------------------------------------
function createManyQuery<S extends ZodObject<any>>(
  listInstance: LList<S>,
  initialArgs: QueryManyArgs<S> = {}
): LQueryManyInstance<S> {
  const ctx = listInstance.context;
  let argsMirror: QueryManyArgs<S> = { ...initialArgs };
  let currentItems: any[] = [];
  let nextCursor: string | null = null;
  let hasNextFlag = false;
  let runId = 0;
  let destroyed = false;

  const dataReactive = createReactive<any[]>();
  dataReactive.init([]);

  const statusManager = createStatusManager(
    async () => {
      const driver = ctx.driver();
      const whereEncoded = ctx.codec.encode(argsMirror.where);
      return driver.count(ctx.name, whereEncoded);
    },
    null,
    true
  );

  const fetchItems = async (isInitial = false) => {
    if (destroyed) return;
    const currentRun = ++runId;
    statusManager.notifyStart(isInitial);

    try {
      const driver = ctx.driver();
      const whereEncoded = ctx.codec.encode(argsMirror.where);

      const takeToFetch = !isInitial && currentItems.length > 0 && argsMirror.take
        ? currentItems.length
        : argsMirror.take;

      const res = await driver.findMany(ctx.name, {
        where: whereEncoded,
        sort: argsMirror.sort,
        take: takeToFetch,
      });

      if (currentRun !== runId || destroyed) return;

      currentItems = res.items.map((it: any) => ctx.codec.decode(it));
      nextCursor = res.nextCursor || null;
      hasNextFlag = argsMirror.take !== undefined && !!nextCursor;

      dataReactive.modify(() => currentItems);
      await statusManager.notifySuccess();
    } catch (err: any) {
      if (currentRun !== runId || destroyed) return;
      const lErr = toLError(err, 'DRIVER/UNKNOWN', 'Failed to fetch query items');
      statusManager.notifyError(lErr);
    }
  };

  void fetchItems(true);

  // Subscribe to list mutations with microtask batching
  let batchScheduled = false;
  const unsubscribe = ctx.changes.subscribe(() => {
    if (destroyed) return;
    if (!batchScheduled) {
      batchScheduled = true;
      queueMicrotask(() => {
        batchScheduled = false;
        if (!destroyed) {
          void fetchItems(false);
        }
      });
    }
  });

  return {
    data: () => (typeof dataReactive.value === 'function' ? (dataReactive.value as any)() : currentItems),
    value: () => argsMirror,
    modify: (updater: (prev: QueryManyArgs<S>) => QueryManyArgs<S>) => {
      argsMirror = updater(argsMirror);
      void fetchItems(false);
    },
    status: (selection?: any) => statusManager.select(selection),
    hasNext: () => hasNextFlag,
    loadNext: async () => {
      if (!hasNextFlag || !nextCursor || destroyed) return;
      const currentRun = ++runId;

      try {
        const driver = ctx.driver();
        const whereEncoded = ctx.codec.encode(argsMirror.where);

        const res = await driver.findMany(ctx.name, {
          where: whereEncoded,
          sort: argsMirror.sort,
          take: argsMirror.take,
          cursor: nextCursor,
        });

        if (currentRun !== runId || destroyed) return;

        const newItems = res.items.map((it: any) => ctx.codec.decode(it));
        currentItems = [...currentItems, ...newItems];
        nextCursor = res.nextCursor || null;
        hasNextFlag = argsMirror.take !== undefined && !!nextCursor;

        dataReactive.modify(() => currentItems);
      } catch (err: any) {
        if (currentRun !== runId || destroyed) return;
        const lErr = toLError(err, 'DRIVER/UNKNOWN', 'Failed to load next query page');
        statusManager.notifyError(lErr);
      }
    },
    destroy: () => {
      destroyed = true;
      unsubscribe();
    },
  };
}

// -------------------------------------------------------------
// IDs Query Implementation
// -------------------------------------------------------------
function createIdsQuery<S extends ZodObject<any>>(
  listInstance: LList<S>,
  initialIds: string[]
): LQueryIdsInstance<S> {
  const ctx = listInstance.context;
  let idsMirror = [...initialIds];
  let currentItems: any[] = [];
  let runId = 0;
  let destroyed = false;

  const dataReactive = createReactive<any[]>();
  dataReactive.init([]);

  const statusManager = createStatusManager(
    async () => idsMirror.length,
    null,
    true
  );

  const fetchItems = async (isInitial = false) => {
    if (destroyed) return;
    const currentRun = ++runId;
    statusManager.notifyStart(isInitial);

    try {
      const driver = ctx.driver();
      const serializedIds = idsMirror.map((id) => driver.serializeId(id));

      const res = await driver.findMany(ctx.name, {
        where: { id: { in: serializedIds } },
      });

      if (currentRun !== runId || destroyed) return;

      const itemsMap = new Map<string, any>();
      for (const raw of res.items) {
        const decoded = ctx.codec.decode(raw);
        itemsMap.set(String(decoded.id), decoded);
      }

      // Reorder items according to input IDs order, dropping non-existent ones
      const ordered: any[] = [];
      for (const id of idsMirror) {
        const found = itemsMap.get(id);
        if (found) {
          ordered.push(found);
        }
      }

      currentItems = ordered;
      dataReactive.modify(() => currentItems);
      await statusManager.notifySuccess();
    } catch (err: any) {
      if (currentRun !== runId || destroyed) return;
      const lErr = toLError(err, 'DRIVER/UNKNOWN', 'Failed to fetch ids query');
      statusManager.notifyError(lErr);
    }
  };

  void fetchItems(true);

  let batchScheduled = false;
  const unsubscribe = ctx.changes.subscribe(() => {
    if (destroyed) return;
    if (!batchScheduled) {
      batchScheduled = true;
      queueMicrotask(() => {
        batchScheduled = false;
        if (!destroyed) {
          void fetchItems(false);
        }
      });
    }
  });

  return {
    data: () => (typeof dataReactive.value === 'function' ? (dataReactive.value as any)() : currentItems),
    value: () => idsMirror,
    modify: (updater: (prev: string[]) => string[]) => {
      idsMirror = updater(idsMirror);
      void fetchItems(false);
    },
    status: (selection?: any) => statusManager.select(selection),
    destroy: () => {
      destroyed = true;
      unsubscribe();
    },
  };
}

// -------------------------------------------------------------
// Single Query Implementation
// -------------------------------------------------------------
function createSingleQuery<S extends ZodObject<any>>(
  listInstance: LList<S>,
  initialArgs: { where: any }
): LQuerySingleInstance<S> {
  const ctx = listInstance.context;
  let argsMirror = { ...initialArgs };
  let currentItem: any = null;
  let runId = 0;
  let destroyed = false;

  const dataReactive = createReactive<any>();
  dataReactive.init(null);

  const statusManager = createStatusManager(
    async () => (currentItem ? 1 : 0),
    null,
    true
  );

  const fetchItem = async (isInitial = false) => {
    if (destroyed) return;
    const currentRun = ++runId;
    statusManager.notifyStart(isInitial);

    try {
      const driver = ctx.driver();
      const whereKeys = Object.keys(argsMirror.where || {});
      const isSingleSimpleKey =
        whereKeys.length === 1 &&
        (whereKeys[0] === 'id' ||
          typeof argsMirror.where[whereKeys[0]] !== 'object');

      let rawResult: any = null;

      if (isSingleSimpleKey) {
        const whereEncoded = ctx.codec.encode(argsMirror.where);
        rawResult = await driver.findUnique(ctx.name, whereEncoded);
      } else {
        const whereEncoded = ctx.codec.encode(argsMirror.where);
        const res = await driver.findMany(ctx.name, {
          where: whereEncoded,
          take: 1,
        });
        rawResult = res.items[0] || null;
      }

      if (currentRun !== runId || destroyed) return;

      currentItem = rawResult ? ctx.codec.decode(rawResult) : null;
      dataReactive.modify(() => currentItem);
      await statusManager.notifySuccess();
    } catch (err: any) {
      if (currentRun !== runId || destroyed) return;
      const lErr = toLError(err, 'DRIVER/UNKNOWN', 'Failed to fetch single query');
      statusManager.notifyError(lErr);
    }
  };

  void fetchItem(true);

  let batchScheduled = false;
  const unsubscribe = ctx.changes.subscribe(() => {
    if (destroyed) return;
    if (!batchScheduled) {
      batchScheduled = true;
      queueMicrotask(() => {
        batchScheduled = false;
        if (!destroyed) {
          void fetchItem(false);
        }
      });
    }
  });

  return {
    data: () => (typeof dataReactive.value === 'function' ? (dataReactive.value as any)() : currentItem),
    value: () => argsMirror,
    modify: (updater: (prev: { where: any }) => { where: any }) => {
      argsMirror = updater(argsMirror);
      void fetchItem(false);
    },
    status: (selection?: any) => statusManager.select(selection),
    destroy: () => {
      destroyed = true;
      unsubscribe();
    },
  };
}

import type {
  Store,
  StoreConfig,
  ReactiveDriver,
  Plugin,
} from './types';

/**
 * createStore<T, R>
 * 
 * Factory function that creates a type-safe reactive store.
 * 
 * Type Parameters:
 * - T: The actual state type (e.g., { count: number })
 * - R: The reactive wrapper type from the driver (e.g., Ref<T>)
 * 
 * The magic: Because T and R are bound through the driver,
 * when you use VueDriver, store.value is automatically typed as Ref<T>
 * without any manual casting or type assertions.
 * 
 * Example:
 *   const vueDriver = new VueDriver<{ count: number }>();
 *   const store = createStore({
 *     initialState: { count: 0 },
 *     driver: vueDriver,
 *   });
 *   // store.value is automatically Ref<{ count: number }>
 *   // TypeScript knows this without any type hints!
 */
export function createStore<T, R>(config: StoreConfig<T, R>): Store<T, R> {
  const { initialState, driver, plugins = [] } = config;

  // Create the internal reactive value using the driver
  const internalReactive = driver.create(initialState);

  // Create a readonly wrapper of the reactive value
  // This ensures external code can't accidentally mutate it
  const readonlyReactive = driver.readonly(internalReactive);

  // Track the current state for comparison during updates
  let currentState = initialState;

  // Initialize all plugins
  plugins.forEach((plugin) => {
    plugin.hooks.onInit?.(currentState);
  });

  /**
   * The modify function: applies an updater function to the state.
   * This is the ONLY way to modify the store, ensuring predictability.
   */
  function modify(updater: (prev: T) => T): void {
    const prevState = currentState;

    // Calculate the next state using the pure updater function
    const nextState = updater(prevState);

    // Avoid unnecessary updates if the state hasn't changed
    if (prevState === nextState) {
      return;
    }

    // Phase 1: Before modification - let plugins inspect/validate
    plugins.forEach((plugin) => {
      plugin.hooks.onBeforeModify?.(prevState, nextState);
    });

    // Phase 2: Apply the modification
    driver.setValue(internalReactive, nextState);
    currentState = nextState;

    // Phase 3: After modification - let plugins react to the change
    plugins.forEach((plugin) => {
      plugin.hooks.onAfterModify?.(prevState, nextState);
    });
  }

  // Return the public store interface
  const store: Store<T, R> = {
    value: readonlyReactive,
    modify,
  };

  return store;
}
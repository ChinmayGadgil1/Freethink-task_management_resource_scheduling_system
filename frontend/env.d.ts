/**
 * Add types (that are not auto-magically added by Quasar CLI already)
 * for your custom variables to avoid TypeScript errors, like dynamic
 * process.env variables or definitions in dotenv files configured ONLY
 * for the /quasar.config file itself.
 *
 * https://quasar.dev/quasar-cli-vite/handling-import-meta-env#type-inference
 *
 * @example
 * interface ImportMetaEnv {
 *   readonly MY_VAR: string;
 *   readonly MY_OTHER_VAR: string;
 * }
 */
interface ImportMetaEnv {}

declare module 'pinia-plugin-persistedstate' {
  import type { PiniaPlugin } from 'pinia';
  export interface PersistenceOptions {
    key?: string;
    storage?: Storage;
    paths?: string[];
    serializer?: {
      serialize: (value: any) => string;
      deserialize: (value: string) => any;
    };
    beforeRestore?: (context: any) => void;
    afterRestore?: (context: any) => void;
    debug?: boolean;
  }
  const createPersistedState: () => PiniaPlugin;
  const piniaPluginPersistedstate: PiniaPlugin;
  export default piniaPluginPersistedstate;
}

import 'pinia';
import type { PersistenceOptions } from 'pinia-plugin-persistedstate';

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    persist?: boolean | PersistenceOptions | PersistenceOptions[];
  }
}

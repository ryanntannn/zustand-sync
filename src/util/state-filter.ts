import type { JsonObject } from "./json.type";

interface StateFilterMap {
  [key: string]: StateFilter;
}
export type StateFilter = true | StateFilterMap;

type ApplyFilter<F, T> = F extends true
  ? T
  : F extends StateFilterMap
  ? T extends object
    ? {
        [K in keyof F & keyof T]: ApplyFilter<F[K], T[K]>;
      }
    : never
  : never;

/**
 * Applies a state filter to an object, returning a new object that includes only the specified keys.
 * @param filter The state filter to apply. Can be `true` (include all), or an object specifying keys to include.
 * @param obj The object to filter.
 * @returns A new object containing only the keys specified by the filter.
 */
export const applyStateFilter = <T extends JsonObject>(
  filter: StateFilter,
  obj: T
): ApplyFilter<StateFilter, T> => {
  if (filter === true) {
    return obj;
  }
  const result: any = {};
  for (const key in filter) {
    if (key in obj) {
      const subFilter = (filter as StateFilterMap)[key];
      const value = (obj as any)[key];
      if (subFilter === true) {
        result[key as keyof T] = value;
      } else if (
        subFilter !== undefined &&
        typeof value === "object" &&
        value !== null
      ) {
        const filteredSubObj = applyStateFilter(subFilter, value);
        if (
          typeof filteredSubObj === "object" &&
          filteredSubObj !== null &&
          Object.keys(filteredSubObj).length > 0
        ) {
          result[key as keyof T] = filteredSubObj as any;
        }
      }
    }
  }
  return result as ApplyFilter<StateFilter, T>;
};

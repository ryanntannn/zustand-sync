import type { Operation } from "fast-json-patch";

/**
 * A type representing a JSON Patch operation.
 * @see https://tools.ietf.org/html/rfc6902
 */
export type JsonPatchOperation = Operation; // we alias this for now i-case we want to swap out the underlying library later

/**
 * Generates a list of JSON Patch operations that transform oldState into newState.
 * @param oldState The original state object.
 * @param newState The updated state object.
 * @returns An array of JSON Patch operations.
 */
export type JSONPatchGenerator = <T extends Object>(
  oldState: T,
  newState: T
) => JsonPatchOperation[];

/**
 * Applies a list of JSON Patch operations to a state object. This function applies the patch in place.
 * @param state The original state object.
 * @param patch An array of JSON Patch operations to apply.
 * @returns The updated state object after applying the patch.
 */
export type JSONPatchApplier = <T extends Object>(
  state: T,
  patch: JsonPatchOperation[]
) => T;

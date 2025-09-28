import { applyPatch, compare } from "fast-json-patch";
import type { JSONPatchApplier, JSONPatchGenerator } from "./patch.type";

const patchGeneratorImpl: JSONPatchGenerator = (oldState, newState) => {
  return compare(oldState, newState);
};

const patchApplierImpl: JSONPatchApplier = (state, patch) => {
  const newState = applyPatch(state, patch, false, false).newDocument;
  return newState;
};

export {
  patchGeneratorImpl as generateJSONPatch,
  patchApplierImpl as applyJSONPatch,
};

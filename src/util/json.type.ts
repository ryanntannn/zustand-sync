export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;

export type JsonArray = JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue;
}

import { describe, it, expect } from "vitest";
import { applyStateFilter } from "../src/util/state-filter";
import type { StateFilter } from "../src/util/state-filter";

describe("applyStateFilter", () => {
  describe("when filter is true", () => {
    it("should return the entire object unchanged", () => {
      const obj = { a: 1, b: 2, c: { d: 3, e: 4 } };
      const result = applyStateFilter(true, obj);
      expect(result).toBe(obj);
    });

    it("should handle empty objects", () => {
      const obj = {};
      const result = applyStateFilter(true, obj);
      expect(result).toBe(obj);
    });

    it("should handle null values in the object", () => {
      const obj = { a: null, b: 2 };
      const result = applyStateFilter(true, obj);
      expect(result).toBe(obj);
    });

    it("should handle arrays in the object", () => {
      const obj = { a: [1, 2, 3], b: "test" };
      const result = applyStateFilter(true, obj);
      expect(result).toBe(obj);
    });
  });

  describe("when filter is an object", () => {
    describe("simple key filtering", () => {
      it("should include only specified keys when filter value is true", () => {
        const obj = { a: 1, b: 2, c: 3 };
        const filter: StateFilter = { a: true, c: true };
        const result = applyStateFilter(filter, obj);

        expect(result).toEqual({ a: 1, c: 3 });
        expect(result).not.toHaveProperty("b");
      });

      it("should return empty object when no keys match", () => {
        const obj = { a: 1, b: 2 };
        const filter: StateFilter = { c: true, d: true };
        const result = applyStateFilter(filter, obj);

        expect(result).toEqual({});
      });

      it("should handle single key filtering", () => {
        const obj = { a: 1, b: 2, c: 3 };
        const filter: StateFilter = { b: true };
        const result = applyStateFilter(filter, obj);

        expect(result).toEqual({ b: 2 });
      });
    });

    describe("nested object filtering", () => {
      it("should filter nested objects recursively", () => {
        const obj = {
          a: 1,
          b: {
            c: 2,
            d: 3,
            e: {
              f: 4,
              g: 5,
            },
          },
          h: 6,
        };
        const filter: StateFilter = {
          a: true,
          b: {
            c: true,
            e: {
              f: true,
            },
          },
        };
        const result = applyStateFilter(filter, obj);

        expect(result).toEqual({
          a: 1,
          b: {
            c: 2,
            e: {
              f: 4,
            },
          },
        });
      });

      it("should include entire nested object when filter value is true", () => {
        const obj = {
          a: 1,
          b: {
            c: 2,
            d: 3,
          },
        };
        const filter: StateFilter = {
          a: true,
          b: true,
        };
        const result = applyStateFilter(filter, obj);

        expect(result).toEqual({
          a: 1,
          b: {
            c: 2,
            d: 3,
          },
        });
      });

      it("should exclude nested objects that result in empty objects", () => {
        const obj = {
          a: 1,
          b: {
            c: 2,
            d: 3,
          },
        };
        const filter: StateFilter = {
          a: true,
          b: {
            nonExistentKey: true,
          },
        };
        const result = applyStateFilter(filter, obj);

        expect(result).toEqual({ a: 1 });
        expect(result).not.toHaveProperty("b");
      });

      it("should handle deeply nested filtering", () => {
        const obj = {
          level1: {
            level2: {
              level3: {
                level4: {
                  value: "deep",
                },
              },
              otherValue: "test",
            },
          },
        };
        const filter: StateFilter = {
          level1: {
            level2: {
              level3: {
                level4: {
                  value: true,
                },
              },
            },
          },
        };
        const result = applyStateFilter(filter, obj);

        expect(result).toEqual({
          level1: {
            level2: {
              level3: {
                level4: {
                  value: "deep",
                },
              },
            },
          },
        });
      });
    });

    describe("edge cases", () => {
      it("should handle null values in nested objects", () => {
        const obj = {
          a: 1,
          b: {
            c: null,
            d: 2,
          },
        };
        const filter: StateFilter = {
          a: true,
          b: {
            c: true,
            d: true,
          },
        };
        const result = applyStateFilter(filter, obj);

        expect(result).toEqual({
          a: 1,
          b: {
            c: null,
            d: 2,
          },
        });
      });

      it("should handle arrays as values", () => {
        const obj = {
          a: [1, 2, 3],
          b: {
            c: [4, 5, 6],
            d: "test",
          },
        };
        const filter: StateFilter = {
          a: true,
          b: {
            c: true,
          },
        };
        const result = applyStateFilter(filter, obj);

        expect(result).toEqual({
          a: [1, 2, 3],
          b: {
            c: [4, 5, 6],
          },
        });
      });

      it("should not include keys when the object value is null", () => {
        const obj = {
          a: 1,
          b: null,
        };
        const filter: StateFilter = {
          a: true,
          b: {
            someKey: true,
          },
        };
        const result = applyStateFilter(filter, obj);

        expect(result).toEqual({ a: 1 });
        expect(result).not.toHaveProperty("b");
      });

      it("should not include keys when the object value is not an object", () => {
        const obj = {
          a: 1,
          b: "string",
          c: 123,
        };
        const filter: StateFilter = {
          a: true,
          b: {
            someKey: true,
          },
          c: {
            anotherKey: true,
          },
        };
        const result = applyStateFilter(filter, obj);

        expect(result).toEqual({ a: 1 });
      });

      it("should handle empty filter object", () => {
        const obj = { a: 1, b: 2 };
        const filter: StateFilter = {};
        const result = applyStateFilter(filter, obj);

        expect(result).toEqual({});
      });

      it("should handle complex mixed data types", () => {
        const obj = {
          string: "test",
          number: 42,
          boolean: true,
          array: [1, 2, 3],
          nullValue: null,
          nested: {
            innerString: "inner",
            innerArray: ["a", "b"],
            deepNested: {
              value: "deep",
            },
          },
        };
        const filter: StateFilter = {
          string: true,
          number: true,
          array: true,
          nullValue: true,
          nested: {
            innerString: true,
            deepNested: {
              value: true,
            },
          },
        };
        const result = applyStateFilter(filter, obj);

        expect(result).toEqual({
          string: "test",
          number: 42,
          array: [1, 2, 3],
          nullValue: null,
          nested: {
            innerString: "inner",
            deepNested: {
              value: "deep",
            },
          },
        });
      });
    });

    describe("performance and immutability", () => {
      it("should not modify the original object", () => {
        const obj = { a: 1, b: { c: 2 } };
        const originalObj = JSON.parse(JSON.stringify(obj));
        const filter: StateFilter = { a: true };

        applyStateFilter(filter, obj);

        expect(obj).toEqual(originalObj);
      });

      it("should create new objects for nested structures", () => {
        const obj = {
          a: 1,
          b: {
            c: 2,
            d: 3,
          },
        };
        const filter: StateFilter = {
          b: {
            c: true,
          },
        };
        const result = applyStateFilter(filter, obj);

        expect(result.b).not.toBe(obj.b);
        expect(result).not.toBe(obj);
      });
    });
  });
});

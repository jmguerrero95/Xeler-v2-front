import { describe, expect, it } from "vitest";
import { responseCollection } from "./responseCollection";

describe("responseCollection", () => {
  it("acepta la colección legacy válida usada por FullLayout y WalletStore", () => {
    expect(responseCollection<{ id: number }>({ data: { response: { data: [{ id: 1 }] } } })).toEqual([{ id: 1 }]);
  });

  it("normaliza una respuesta vacía legítima sin dereferenciar data", () => {
    expect(responseCollection({ data: { response: [] } })).toEqual([]);
    expect(responseCollection({ data: {} })).toEqual([]);
  });

  it("normaliza ausencia temporal o falla sin ejecutar filter sobre undefined", () => {
    expect(responseCollection(undefined)).toEqual([]);
    expect(responseCollection({})).toEqual([]);
  });

  it("acepta el sobre moderno data", () => {
    expect(responseCollection<{ id: number }>({ data: { data: [{ id: 7 }] } })).toEqual([{ id: 7 }]);
  });
});

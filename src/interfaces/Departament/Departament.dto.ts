import type { BaseUpdate } from "../Base.model";
import type { DepartamentAttributes } from "./Departament.model";

export type DepartamentCreate = DepartamentAttributes;
export declare interface DepartamentUpdate
  extends DepartamentAttributes,
    BaseUpdate {}

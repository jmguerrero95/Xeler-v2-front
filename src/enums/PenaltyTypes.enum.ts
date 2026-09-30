export enum PENALTY_TYPES {
    COMPRA = "buy",
    VENTA  = "sell",
}
export const PENALTY_NAMES: Record<PENALTY_TYPES, string> = {
    [PENALTY_TYPES.COMPRA]: "Compra",
    [PENALTY_TYPES.VENTA]: "Venta",
}

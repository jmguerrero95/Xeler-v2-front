export declare interface Calculator {
    amountFiat: string | number
    amountCrypto: string | number
    amountUsd: string | number
    tasaCompra: string | number
    tasaVenta: string | number
    criptoOficial: string | number
    localOficial: string | number
    inputSide?: "fiat" | "crypto"
}

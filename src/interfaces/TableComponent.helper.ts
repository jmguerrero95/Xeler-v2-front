export declare type Head = {
    name: string
    value: string
    status?: boolean | 'deleted'
    type?: TypeHead
    format?: string
    class?: string| string[]
    style?: string| string[]
}
export declare type TypeHead = 'text' | 'number' | 'date'

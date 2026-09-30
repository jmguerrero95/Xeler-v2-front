import type { BaseUpdate } from "../Base.model";
import type { WalletAttributes } from "./Wallet.model";

export declare interface WalletCreate extends WalletAttributes{}
export declare interface WalletUpdate extends WalletAttributes,BaseUpdate{}
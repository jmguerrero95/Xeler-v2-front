import type { Ref } from "vue"
import type { EventComponent } from "./Components.helper"

export declare interface Row {
  fields: Field[]
  rowClass?: Array<string>
}

export declare interface Field{
  label: string
  text?: string,
  valueForm: string
  type: typeField
  rules?: Array<any> 
  select?: Select
  colClass?: Array<string>
  fieldClass?: Array<string>
  colStyle?: Array<string>
  fieldStyle?: Array<string>
  props?: any
  phone?: {
    fieldCode: string,
    fieldPhone: string
    fieldValid: string
  },
  events?: EventComponent
  decode?: Function
  hideSpinner?: boolean
}

export type Events = 'keypress' | 'keyup'

interface Select {
  itemValue: string
  itemTitle: string
  items: Ref<any[]>
  menuProps?: Object
  multiple?: boolean
}

type typeField = 'text'
| 'select'
| 'date'
| 'textarea'
| 'number'
| 'password'
| 'hidden'
| 'switch'
| 'image'
| 'color'
| 'phone'
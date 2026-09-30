export declare interface BaseModel<Attributes, Relationships> {
  id: number;
  attributes: Attributes & { created_at: Date; updated_at: Date };
  relationships?: Relationships;
}

export declare interface BaseModelSoftDelete<Attributes, Relationships>
  extends BaseModel<Attributes, Relationships> {
  attributes: Attributes & {
    created_at: Date;
    updated_at: Date;
    deleted_at: Date;
  };
}

export declare interface BaseUpdate {
  id: number;
}

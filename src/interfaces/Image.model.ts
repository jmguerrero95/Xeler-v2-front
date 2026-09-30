import type { BaseModelSoftDelete } from "./Base.model";

export declare interface Image extends BaseModelSoftDelete<ImageAttributes,null>{}

export declare interface ImageAttributes {
    filename: string;
    url?: string | null;
    download_url?: string | null;
    imageable_type: string;
    imageable_id: number;
    tag?: string | null;
    name: string;
    description?: string | null;
    category?: string | null;
    created_at: string;
    updated_at: string;
    aws_url: string | null;
    mime?: string | null;
    size?: number | null;
    uploaded_at?: string | null;
}

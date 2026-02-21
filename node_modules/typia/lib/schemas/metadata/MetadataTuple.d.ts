import { IMetadataTuple } from "./IMetadataTuple";
import { IMetadataTypeTag } from "./IMetadataTypeTag";
import { MetadataTupleType } from "./MetadataTupleType";
export declare class MetadataTuple {
    readonly type: MetadataTupleType;
    readonly tags: IMetadataTypeTag[][];
    /** @ignore */
    private constructor();
    toJSON(): IMetadataTuple;
}

import { IMetadataArrayType } from "./IMetadataArrayType";
import { Metadata } from "./Metadata";
export declare class MetadataArrayType {
    readonly name: string;
    readonly value: Metadata;
    readonly nullables: boolean[];
    readonly recursive: boolean;
    readonly index: number | null;
    /** @ignore */
    private constructor();
    toJSON(): IMetadataArrayType;
}

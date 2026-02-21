import { IJsDocTagInfo } from "./IJsDocTagInfo";
import { IMetadataAliasType } from "./IMetadataAliasType";
import { Metadata } from "./Metadata";
export declare class MetadataAliasType {
    readonly name: string;
    readonly value: Metadata;
    readonly description: string | null;
    readonly jsDocTags: IJsDocTagInfo[];
    readonly recursive: boolean;
    readonly nullables: boolean[];
    /** @ignore */
    private constructor();
    toJSON(): IMetadataAliasType;
}

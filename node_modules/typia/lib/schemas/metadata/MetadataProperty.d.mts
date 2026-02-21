import { IProtobufProperty } from "../protobuf/IProtobufProperty";
import { IJsDocTagInfo } from "./IJsDocTagInfo";
import { IMetadataProperty } from "./IMetadataProperty";
import { Metadata } from "./Metadata";
export declare class MetadataProperty {
    readonly key: Metadata;
    readonly value: Metadata;
    readonly description: string | null;
    readonly jsDocTags: IJsDocTagInfo[];
    readonly mutability?: "readonly" | null | undefined;
    of_protobuf_?: IProtobufProperty;
    /** @ignore */
    private constructor();
    toJSON(): IMetadataProperty;
}

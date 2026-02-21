import { ClassProperties } from "../../typings/ClassProperties";
import { IMetadataObject } from "./IMetadataObject";
import { IMetadataTypeTag } from "./IMetadataTypeTag";
import { MetadataObjectType } from "./MetadataObjectType";
export declare class MetadataObject {
    readonly type: MetadataObjectType;
    readonly tags: IMetadataTypeTag[][];
    private name_?;
    /** @ignore */
    private constructor();
    static create(props: ClassProperties<MetadataObject>): MetadataObject;
    getName(): string;
    toJSON(): IMetadataObject;
}

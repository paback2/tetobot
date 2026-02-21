"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataProperty = void 0;
const Metadata_1 = require("./Metadata");
class MetadataProperty {
    /* -----------------------------------------------------------
          CONSTRUCTORS
      ----------------------------------------------------------- */
    /** @ignore */
    constructor(props) {
        this.key = props.key;
        this.value = props.value;
        this.description = props.description;
        this.jsDocTags = props.jsDocTags;
        this.mutability = props.mutability;
    }
    /** @internal */
    static create(props) {
        return new MetadataProperty(props);
    }
    /** @internal */
    static from(property, dict) {
        return MetadataProperty.create({
            key: Metadata_1.Metadata.from(property.key, dict),
            value: Metadata_1.Metadata.from(property.value, dict),
            description: property.description,
            jsDocTags: property.jsDocTags.slice(),
            mutability: property.mutability,
        });
    }
    toJSON() {
        return {
            key: this.key.toJSON(),
            value: this.value.toJSON(),
            description: this.description,
            jsDocTags: this.jsDocTags,
            mutability: this.mutability,
        };
    }
}
exports.MetadataProperty = MetadataProperty;
//# sourceMappingURL=MetadataProperty.js.map
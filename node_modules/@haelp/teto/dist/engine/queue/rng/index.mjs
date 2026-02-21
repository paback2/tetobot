import { Bag7 } from "./bag7.mjs";
import { Bag7Plus1 } from "./bag7-1.mjs";
import { Bag7Plus2 } from "./bag7-2.mjs";
import { Bag7PlusX } from "./bag7-x.mjs";
import { Bag14 } from "./bag14.mjs";
import { Classic } from "./classic.mjs";
import { Pairs } from "./pairs.mjs";
import { Random } from "./random.mjs";
export const rngMap = {
    "7-bag": Bag7,
    "14-bag": Bag14,
    classic: Classic,
    pairs: Pairs,
    "total mayhem": Random,
    "7+1-bag": Bag7Plus1,
    "7+2-bag": Bag7Plus2,
    "7+x-bag": Bag7PlusX
};
export * from "./core.mjs";
export * from "./bag7.mjs";
export * from "./bag14.mjs";
export * from "./classic.mjs";
export * from "./pairs.mjs";
export * from "./random.mjs";
export * from "./bag7-1.mjs";
export * from "./bag7-2.mjs";
export * from "./bag7-x.mjs";

//# sourceMappingURL=index.js.map
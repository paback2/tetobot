import { RNG } from "../../utils/index.mjs";
export class Bag {
    rng;
    id = 0;
    extra = [];
    lastGenerated = null;
    constructor(seed){
        this.rng = new RNG(seed);
    }
    snapshot() {
        return {
            rng: this.rng.seed,
            id: this.id,
            extra: this.extra.slice(),
            lastGenerated: this.lastGenerated
        };
    }
    // note: not static because of inheritance
    fromSnapshot(snapshot) {
        this.rng = new RNG(snapshot.rng);
        this.id = snapshot.id;
        this.extra = snapshot.extra.slice();
        this.lastGenerated = snapshot.lastGenerated;
    }
}

//# sourceMappingURL=core.js.map
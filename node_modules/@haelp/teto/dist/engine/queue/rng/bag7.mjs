import { Mino } from "../types.mjs";
import { Bag } from "./core.mjs";
export class Bag7 extends Bag {
    next() {
        return this.rng.shuffleArray([
            Mino.Z,
            Mino.L,
            Mino.O,
            Mino.S,
            Mino.I,
            Mino.J,
            Mino.T
        ]);
    }
}

//# sourceMappingURL=bag7.js.map
import { Mino } from "../types.mjs";
import { Bag } from "./core.mjs";
export class Bag14 extends Bag {
    next() {
        return this.rng.shuffleArray([
            Mino.Z,
            Mino.L,
            Mino.O,
            Mino.S,
            Mino.I,
            Mino.J,
            Mino.T,
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

//# sourceMappingURL=bag14.js.map
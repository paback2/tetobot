import { Mino } from "../types.mjs";
import { Bag } from "./core.mjs";
export class Bag7Plus1 extends Bag {
    next() {
        return this.rng.shuffleArray([
            Mino.Z,
            Mino.L,
            Mino.O,
            Mino.S,
            Mino.I,
            Mino.J,
            Mino.T,
            [
                Mino.Z,
                Mino.L,
                Mino.O,
                Mino.S,
                Mino.I,
                Mino.J,
                Mino.T
            ][Math.floor(this.rng.nextFloat() * 7)]
        ]);
    }
}

//# sourceMappingURL=bag7-1.js.map
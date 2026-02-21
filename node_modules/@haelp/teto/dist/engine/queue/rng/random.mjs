import { Mino } from "../types.mjs";
import { Bag } from "./core.mjs";
export class Random extends Bag {
    next() {
        const TETROMINOS = [
            Mino.Z,
            Mino.L,
            Mino.O,
            Mino.S,
            Mino.I,
            Mino.J,
            Mino.T
        ];
        return [
            TETROMINOS[Math.floor(this.rng.nextFloat() * TETROMINOS.length)]
        ];
    }
}

//# sourceMappingURL=random.js.map
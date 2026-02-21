import { Mino } from "../types.mjs";
import { Bag } from "./core.mjs";
export class Classic extends Bag {
    static #TETROMINOS = [
        Mino.Z,
        Mino.L,
        Mino.O,
        Mino.S,
        Mino.I,
        Mino.J,
        Mino.T
    ];
    next() {
        let index = Math.floor(this.rng.nextFloat() * (Classic.#TETROMINOS.length + 1));
        if (index === this.lastGenerated || index >= Classic.#TETROMINOS.length) {
            index = Math.floor(this.rng.nextFloat() * Classic.#TETROMINOS.length);
        }
        this.lastGenerated = index;
        return [
            Classic.#TETROMINOS[index]
        ];
    }
}

//# sourceMappingURL=classic.js.map
export class IncreaseTracker {
    #value;
    base;
    increase;
    margin;
    frame;
    constructor(base, increase, margin){
        this.#value = this.base = base;
        this.increase = increase;
        this.margin = margin;
        this.frame = 0;
    }
    reset() {
        this.#value = this.base;
        this.frame = 0;
    }
    tick() {
        this.frame++;
        if (this.frame > this.margin) this.#value += this.increase / 60;
        return this.get();
    }
    get() {
        return this.#value;
    }
    set(value) {
        this.#value = value;
    }
}

//# sourceMappingURL=index.js.map
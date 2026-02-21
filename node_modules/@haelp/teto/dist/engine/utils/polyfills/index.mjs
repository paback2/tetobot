(function(polyfills) {
    class Map {
        #entries = [];
        constructor(iterable){
            if (iterable) {
                for (const [key, value] of iterable){
                    this.set(key, value);
                }
            }
        }
        get size() {
            return this.#entries.length;
        }
        set = (key, value)=>{
            const index = this.#entries.findIndex(([k])=>k === key);
            if (index !== -1) {
                this.#entries[index][1] = value;
            } else {
                this.#entries.push([
                    key,
                    value
                ]);
            }
            return this;
        };
        get = (key)=>{
            const entry = this.#entries.find(([k])=>k === key);
            return entry ? entry[1] : undefined;
        };
        has = (key)=>{
            return this.#entries.some(([k])=>k === key);
        };
        delete = (key)=>{
            const index = this.#entries.findIndex(([k])=>k === key);
            if (index !== -1) {
                this.#entries.splice(index, 1);
                return true;
            }
            return false;
        };
        clear = ()=>{
            this.#entries = [];
        };
        forEach = (callback, thisArg)=>{
            // Use a shallow copy to prevent issues if the map is modified during iteration
            const entriesCopy = this.#entries.slice();
            for (const [key, value] of entriesCopy){
                callback.call(thisArg, value, key, this);
            }
        };
        *entries() {
            for (const entry of this.#entries){
                yield entry;
            }
        }
        *keys() {
            for (const [key] of this.#entries){
                yield key;
            }
        }
        *values() {
            for (const [, value] of this.#entries){
                yield value;
            }
        }
        [Symbol.iterator] = function*() {
            yield* this.entries();
        };
    }
    polyfills.Map = Map;
})(polyfills || (polyfills = {}));
export var polyfills;

//# sourceMappingURL=index.js.map
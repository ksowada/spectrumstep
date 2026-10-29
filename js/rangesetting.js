
class RangeSetting {
    constructor(id, callback) {
        this.range = document.getElementById(id);
        this.output = document.getElementById(`${id}-value`);
        this.callback = callback;

        this.value = Number(this.range.value);
        this.output.textContent = this.value;

        this.range.addEventListener('input', () => {
            this.value = Number(this.range.value);
            this.output.textContent = this.value;

            this.callback();
        });
    }

    set(value) {
        this.value = value;
        this.range.value = value;
        this.output.textContent = value;
    }

    get() {
        return this.value;
    }
}

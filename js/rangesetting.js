
class RangeSetting {
    constructor(id, callback, tooltip = undefined, format = undefined) {
        // Optional display formatter for the output (e.g. last tick shown as ∞)
        this.format = typeof format === 'function' ? format : (v) => v;
        this.range = document.getElementById(id);
        this.output = document.getElementById(`${id}-value`);
        // Label may sit inside the fieldset legend; fall back to the legend itself
        this.label = document.querySelector(`label[for="${id}"]`)
            ?? this.range.closest('fieldset')?.querySelector('legend');
        this.callback = callback;

        if (tooltip) {
            const rangeTip = typeof tooltip === 'object' ? tooltip.range : tooltip;
            const labelTip = typeof tooltip === 'object' ? (tooltip.label || tooltip.range) : tooltip;
            const outputTip = typeof tooltip === 'object' ? (tooltip.output || tooltip.range) : tooltip;
            if (this.range && rangeTip) this.range.dataset.tooltip = rangeTip;
            if (this.label && labelTip) this.label.dataset.tooltip = labelTip;
            if (this.output && outputTip) this.output.dataset.tooltip = outputTip;
        }

        this.value = Number(this.range.value);
        this.output.textContent = this.format(this.value);

        this.range.addEventListener('input', () => {
            this.value = Number(this.range.value);
            this.output.textContent = this.format(this.value);

            this.callback();
        });
    }

    set(value) {
        this.value = value;
        this.range.value = value;
        this.output.textContent = this.format(value);
    }

    get() {
        return this.value;
    }
}

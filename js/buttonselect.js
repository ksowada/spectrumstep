class ButtonSelect {
    /**
     * @param {HTMLElement} container  Container mit den .btn-select Elementen
     * @param {Function}    onSelect   Callback(selectedId, selectedEl, instance)
     */
    constructor(container, onSelect) {
        this.container = container;
        this.onSelect  = onSelect;
        this.buttons   = Array.from(container.querySelectorAll('.btn-select'));
        this._value    = null;

        this.buttons.forEach(el => {
            el.addEventListener('click', () => this.setValue(el.id));

            // Color-Input: auf Farbänderung reagieren
            const colorInput = el.querySelector('input[type="color"]');
            if (colorInput) {
                colorInput.addEventListener('input', () => {
                    this._applyColorAccent(el, colorInput.value);
                    this.setValue(el.id);
                });
            }
        });
    }

    /** Liefert die id des aktuell selektierten Elements */
    getValue() {
        return this._value;
    }

    /**
     * Selektiert das Element mit der übergebenen id.
     * @param {string}  [id] wenn undefined, löst die Selektion aus
     * @param {boolean} fireEvent  Standard true – Callback auslösen?
     */
    setValue(id, fireEvent = true) {
        // Auswahl aufheben
        if (id === undefined || id === null) {
            this.buttons.forEach(b => b.classList.remove('selected'));
            this._value = null;

            if (fireEvent && typeof this.onSelect === 'function') {
                this.onSelect(null, null, this);
            }
            return;
        }

        const el = this.buttons.find(b => b.id === id);
        if (!el) return;

        const changed = id !== this._value;

        if (changed) {
            this.buttons.forEach(b => b.classList.remove('selected'));
            el.classList.add('selected');
            this._value = id;
        }

        if (fireEvent && typeof this.onSelect === 'function') {
            this.onSelect(id, el, this);
        }
    }

    /** Setzt die Rand-Farbe (CSS-Variable --accent) am Button */
    _applyColorAccent(el, color) {
        el.style.setProperty('--accent', color);
    }
}
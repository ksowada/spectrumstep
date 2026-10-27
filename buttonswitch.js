class ButtonSwitch {
    constructor(cell, texte, onChangeArg, onChange) {
        this.cell = cell;
        this.texte = texte;
        this.onChange = onChange;
        this.onChangeArg = onChangeArg;
        this.index = 0;
        this._build();
    }

    _build() {
        this.btn = document.createElement('button');
        this.btn.type = 'button';
        this.btn.className = 'status-btn';

        this.icon = document.createElement('img');
        this.icon.src = 'icons/repeat-solid-full.svg';
        this.icon.alt = '';
        this.icon.className = 'icon';

        this.label = document.createElement('span');
        this.label.textContent = this.texte[this.index];
        this.label.className = 'label';

        this.btn.append(this.icon, this.label);
        this.btn.addEventListener('click', () => this._next());

        this.cell.appendChild(this.btn);
    }

    _next() {
        this.index = (this.index + 1) % this.texte.length;
        this.label.textContent = this.texte[this.index];

        // Callback in die plain-Welt
        if (typeof this.onChange === 'function') {
            this.onChange(this.texte[this.index], this.index, this, this.onChangeArg);
        }
    }

    /**
     * Text von außen setzen.
     * @param {string} text - muss in this.texte enthalten sein
     * @param {boolean} [silent=false] - true = kein onChange-Callback
     * @returns {boolean} true wenn gesetzt, false wenn Text unbekannt
     */
    setValue(text, silent = false) {
        const idx = this.texte.indexOf(text);
        if (idx === -1) {
            console.warn(`StatusButton.setValue: "${text}" ist nicht in der Liste`, this.texte);
            return false;
        }
        this.index = idx;
        this.label.textContent = this.texte[this.index];
        if (!silent && typeof this.onChange === 'function') {
            this.onChange(this.texte[this.index], this.index, this, this.onChangeArg);
        }
        return true;
    }

    // optionale API
    get value() { return this.texte[this.index]; }
    set(index) {
        this.index = index % this.texte.length;
        this.label.textContent = this.texte[this.index];
    }
}
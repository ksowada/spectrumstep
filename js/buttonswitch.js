class ButtonSwitch {
    /**
     * @param {HTMLTableCellElement} cell
     * @param {string[]} texte
     * @param {string|string[]|undefined} icons
     * @param {*} onChangeArg
     * @param {(text:string,index:number,btn:ButtonSwitch,arg:*)=>void} onChange
     * @param {{ showText?: boolean, tooltips?: string|string[]|Record<string,string>, ring?: boolean }} [options]
     *        ring (Default true): Rahmen-Segment (360°/n) zeigt den aktuellen Schritt an
     *        und dreht pro Klick um 360°/n weiter. Farbe/Dauer über CSS-Variablen
     *        --btn-switch-color / --btn-highlight-duration.
     */
    constructor(cell, texte, icons = undefined, onChangeArg, onChange, options = {}) {
        if (texte.length === 0) {
            throw new Error('ButtonSwitch: texte darf nicht leer sein');
        }

        this.cell = cell;
        this.texte = texte;
        this.hasIcon = icons !== undefined;
        this.icons = this.hasIcon ? this._normalizeIcons(icons, texte.length) : null;
        this.showText = options.showText !== false;    // Default: true
        this.tooltips = options.tooltips !== undefined ? this._normalizeTooltips(options.tooltips, texte) : null;
        this.ring = options.ring !== false;           // Default: true
        this._turn = 0;                               // fortlaufender Schrittzähler → Animation läuft immer vorwärts
        this.onChange = onChange;
        this.onChangeArg = onChangeArg;
        this.index = 0;
        this._build();
    }

    _normalizeIcons(icons, n) {
        if (typeof icons === 'string') {
            return Array(n).fill(icons);
        }
        if (Array.isArray(icons)) {
            if (icons.length !== n) {
                throw new Error(
                    `ButtonSwitch: icons-Array (${icons.length}) muss so lang sein wie texte (${n})`
                );
            }
            return icons.slice();
        }
        throw new TypeError('ButtonSwitch: icons muss string, string[] oder undefined sein');
    }

    _normalizeTooltips(tooltips, texte) {
        if (typeof tooltips === 'string') {
            return Array(texte.length).fill(tooltips);
        }
        if (Array.isArray(tooltips)) {
            return tooltips.slice();
        }
        if (typeof tooltips === 'object' && tooltips !== null) {
            return texte.map(t => tooltips[t] || '');
        }
        return null;
    }

    _build() {
        this.btn = document.createElement('button');
        this.btn.type = 'button';
        this.btn.className = 'status-btn';
        if (!this.showText) this.btn.classList.add('icon-only');
        if (this.ring) {
            this.btn.classList.add('step-ring');
            this.btn.style.setProperty('--ring-span', `${360 / this.texte.length}deg`);
        }

        this.icon = null;
        if (this.hasIcon) {
            this.icon = document.createElement('img');
            this.icon.alt = '';
            this.icon.className = 'icon';
            this.btn.append(this.icon);
        }

        this.label = null;
        if (this.showText) {
            this.label = document.createElement('span');
            this.label.className = 'label';
            this.btn.append(this.label);
        }

        // Safety: leerer Button wäre klickbar aber unsichtbar – verhindern
        if (!this.hasIcon && !this.showText) {
            throw new Error('ButtonSwitch: mindestens Icon oder Text muss sichtbar sein (showText:false + kein Icon)');
        }

        this.btn.addEventListener('click', () => this._next());
        this.cell.appendChild(this.btn);

        this._render();
    }

    _render() {
        if (this.ring) {
            const span = 360 / this.texte.length;
            this.btn.style.setProperty('--ring-start', `${this._turn * span - span / 2}deg`);
        }
        if (this.showText) {
            this.label.textContent = this.texte[this.index];
        }
        if (this.hasIcon) {
            this.icon.src = this.icons[this.index];
        }
        if (this.tooltips && this.tooltips[this.index]) {
            this.btn.dataset.tooltip = this.tooltips[this.index];
            if (typeof updateActiveTooltip === 'function') {
                updateActiveTooltip(this.btn);
            }
        }
    }

    _next() {
        this.index = (this.index + 1) % this.texte.length;
        this._turn++;
        this._render();
        if (typeof this.onChange === 'function') {
            this.onChange(this.texte[this.index], this.index, this, this.onChangeArg);
        }
    }

    setValue(text, silent = false) {
        const idx = this.texte.indexOf(text);
        if (idx === -1) {
            console.warn(`ButtonSwitch.setValue: "${text}" ist nicht in der Liste`, this.texte);
            return false;
        }
        this._syncTurn(idx);
        this.index = idx;
        this._render();
        if (!silent && typeof this.onChange === 'function') {
            this.onChange(this.texte[this.index], this.index, this, this.onChangeArg);
        }
        return true;
    }

    get value()   { return this.texte[this.index]; }
    /** same accessor as ButtonSelect.getValue() (there: the id of the selected button) */
    getValue()    { return this.texte[this.index]; }
    get iconSrc() { return this.hasIcon ? this.icons[this.index] : null; }

    set(index) {
        const n = this.texte.length;
        const idx = ((index % n) + n) % n;
        this._syncTurn(idx);
        this.index = idx;
        this._render();
    }

    /** Dreht den Zähler auf den nächsten Stand vorwärts, der idx entspricht (keine Rückwärts-Animation). */
    _syncTurn(idx) {
        const n = this.texte.length;
        this._turn += ((idx - this.index) % n + n) % n;
    }
}
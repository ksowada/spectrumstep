class ButtonSwitch {
    /**
     * @param {HTMLTableCellElement} cell
     * @param {string[]} texte
     * @param {string|string[]|undefined} icons
     * @param {*} onChangeArg
     * @param {(text:string,index:number,btn:ButtonSwitch,arg:*)=>void} onChange
     * @param {{ showText?: boolean }} [options]
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

    _build() {
        this.btn = document.createElement('button');
        this.btn.type = 'button';
        this.btn.className = 'status-btn';

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
        if (this.showText) {
            this.label.textContent = this.texte[this.index];
        }
        if (this.hasIcon) {
            this.icon.src = this.icons[this.index];
        }
    }

    _next() {
        this.index = (this.index + 1) % this.texte.length;
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
        this.index = idx;
        this._render();
        if (!silent && typeof this.onChange === 'function') {
            this.onChange(this.texte[this.index], this.index, this, this.onChangeArg);
        }
        return true;
    }

    get value()   { return this.texte[this.index]; }
    get iconSrc() { return this.hasIcon ? this.icons[this.index] : null; }

    set(index) {
        const n = this.texte.length;
        this.index = ((index % n) + n) % n;
        this._render();
    }
}
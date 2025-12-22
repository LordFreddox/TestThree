export class VirtualKeyboard {
    private container: HTMLDivElement;
    private activeInput: HTMLInputElement | null = null;

    constructor() {
        this.container = this.createKeyboard();
        document.body.appendChild(this.container);
        this.registerEvents();
    }

    private createKeyboard(): HTMLDivElement {
        const div = document.createElement('div');
        div.className = 'keyboard hidden';

        div.innerHTML = `
            <div class="keys">
                ${[1,2,3,4,5,6,7,8,9]
                    .map(n => `<button data-key="${n}">${n}</button>`)
                    .join('')}
                <button data-key="0" class="zero">0</button>
                <button data-action="back">⌫</button>
                <button data-action="close">✔</button>
            </div>
        `;

        return div;
    }

    private registerEvents(): void {
        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const key = target.dataset.key;
            const action = target.dataset.action;

            if (!this.activeInput) return;

            if (key) {
                this.activeInput.value += key;
            }

            if (action === 'back') {
                this.activeInput.value =
                    this.activeInput.value.slice(0, -1);
            }

            if (action === 'close') {
                this.hide();
            }
        });
    }

    public openForInput(input: HTMLInputElement): void {
        this.activeInput = input;
        this.show();
    }

    private show(): void {
        this.container.classList.remove('hidden');
    }

    private hide(): void {
        this.container.classList.add('hidden');
        this.activeInput = null;
    }
}

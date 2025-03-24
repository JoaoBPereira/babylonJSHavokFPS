class Log {
    mDiv: HTMLDivElement;
    mText: string;

    constructor(div: HTMLDivElement) {
        this.mDiv = div;
        this.mText = "";
    }

    Log(text: string): void {
        this.mText += text + "</br>";
    }

    Display(): void {
        if (this.mText != null && this.mText.length > 0) {
            this.mDiv.innerHTML = this.mText;
            this.mText = "";
        }
    }
}

export default Log;

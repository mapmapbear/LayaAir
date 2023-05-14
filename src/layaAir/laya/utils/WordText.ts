/**
 * @private
 */
export class WordText {
    text: string;
    width: number;	//整个WordText的长度。-1表示没有计算还。
    pageChars: any[];	//把本对象的字符按照texture分组保存的文字信息。里面又是一个数组。具体含义见使用的地方。
    scalex;	// 缓存的时候的缩放
    scaley;

    _nativeObj: any;
    _splitRender: boolean;	// 强制拆分渲染

    constructor() {
        if ((window as any).conch && !(window as any).conchConfig.conchWebGL)
            this._nativeObj = new (window as any)._conchWordText();
        else {
            this.width = -1;
            this.pageChars = [];
            this.scalex = 1;
            this.scaley = 1;
        }
    }

    setText(txt: string): void {
        if (this._nativeObj)
            this._nativeObj._text = txt;
        else {
            this.text = txt;
            this.width = -1;
        }
        this.cleanCache();
    }

    toString(): string {
        return this.text;
    }

    get length(): number {
        return this.text ? this.text.length : 0;
    }

    /**
     * 自己主动清理缓存，需要把关联的贴图删掉
     * 不做也可以，textrender会自动清理不用的
     * TODO 重用
     */
    cleanCache(): void {
        if (this._nativeObj) {
            this._nativeObj.cleanCache();
            return;
        }

        // 如果是独占文字贴图的，需要删掉
        //TODO 这个效果不对。会造成文字错乱
        let chars = this.pageChars;
        for (let p of chars) {
            let tex = p.tex;
            let words = p.words;
            if (words.length == 1 && tex && tex.ri) {// 如果有ri表示是独立贴图
                tex.destroy();
            }
        }
        this.pageChars = [];
        this.scalex = 1;
        this.scaley = 1;
    }

    get splitRender() {
        return this._splitRender;
    }

    set splitRender(value: boolean) {
        this._splitRender = value;
        if (this._nativeObj)
            this._nativeObj.splitRender = value;
    }
}
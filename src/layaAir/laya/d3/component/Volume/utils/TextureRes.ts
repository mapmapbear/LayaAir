import { Laya } from "Laya";
import { Loader } from "laya/net/Loader";
import { Handler } from "laya/utils/Handler";
import { Texture2D } from "laya/resource/Texture2D";

/**
 * 贴图资源
 */
export class TextureRes {
    url: string;
    tex: Texture2D;

    constructor(url?: string, tex?: Texture2D) {
        this.url = url;
        this.tex = tex;
    }

    /**
     * 获取资源
     * @param next
     * @returns 
     */
    getRes(next?: Function, cache: boolean = true) {
        if (this.tex)
            return this.tex;
        if (this.url) {
            Laya.loader.load({ url: this.url, type: Loader.TEXTURE2D }, Handler.create(this, (t: Texture2D) => {
                this.tex = t;
                next && next(this);
            }), null, null, null, cache);
        } else if(next) next(this);
    }

    /**
     * 销毁
     */
    destroy() {
        if (this.tex)
            this.tex.destroy();
        this.tex = null;
        this.url = null;
    }
}
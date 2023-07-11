import { Laya } from "Laya";
import { TreeTexComb } from "./TreeTexComb";
import { BaseTexture } from "laya/resource/BaseTexture";
import { Functions } from "../utils/Functions";

/**
 * 植物贴图管理器
 */
export class TreeTexManager {
    private _size = 512;
    private _timer: number = 0;
    private _texs: Map<string, BaseTexture> = new Map();

    constructor() { }

    /**
     * 每帧执行
     */
    everyFrame() {
        this._timer += Laya.timer.delta;
        if (this._timer > 200) {
            this._timer = 0;
        }
    }

    /**
     * 获取组合字符串
     * @param bark 
     * @param stem
     * @param leaf 
     * @param squama 
     * @param flower 
     * @returns 
     */
    private _getStr(bark: string, stem: string, leaf: string, squama: string, flower: string) {
        let str = "s_";
        if (bark.length > 0)
            str += '|' + bark;
        if (stem.length > 0)
            str += '|' + stem;
        if (leaf.length > 0)
            str += '|' + leaf;
        if (squama.length > 0)
            str += '|' + squama;
        if (flower.length > 0)
            str += '|' + flower;
        return str;
    }

    /**
     * 获取纹理
     * @param bark 
     * @param stem 
     * @param leaf 
     * @param squama 
     * @param flower 
     * @returns 
     */
    getTexture(bark: string, stem: string, leaf: string, squama: string, flower: string) {
        const str = this._getStr(bark, stem, leaf, squama, flower);
        const tex = this._texs.get(str);
        if (tex) return tex;
        const ttb = new TreeTexComb(this._size, bark, stem, leaf, squama, flower);
        this._texs.set(str, ttb.combTex);
        return ttb.combTex;
    }

    /**
     * 删除纹理
     * @param bark 
     * @param stem 
     * @param leaf 
     * @param squama 
     * @param flower 
     */
    delTexture(bark: string, stem: string, leaf: string, squama: string, flower: string) {
        const str = this._getStr(bark, stem, leaf, squama, flower);
        const tex = this._texs.get(str);
        if (tex) {
            tex.destroy();
            this._texs.delete(str);
        }
    }

    /**
     * 将组合贴图都保存到文件中
     */
    saveTextureToDisk() {
        let count = 0;
        this._texs.forEach(t => {
            const file = "TreeComb" + count++ + ".png";
            Functions.saveDataToFile(Functions.rt2Data(t as any), file);
        });
    }

    /**
     * 清空
     */
    clear() {
        this._texs.forEach(t => t.destroy());
        this._texs.clear();
    }

    /**
     * 销毁
     */
    destroy() {
        this.clear();
    }
}
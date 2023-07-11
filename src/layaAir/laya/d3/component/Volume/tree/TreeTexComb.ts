import { Laya } from "Laya";
import { Loader } from "laya/net/Loader";
import { Handler } from "laya/utils/Handler";
import { CommandBuffer } from "laya/d3/core/render/command/CommandBuffer";
import { RenderContext3D } from "laya/d3/core/render/RenderContext3D";
import { RenderTargetFormat } from "laya/RenderEngine/RenderEnum/RenderTargetFormat";
import { Texture2D } from "laya/resource/Texture2D";
import { TreeSystem } from "./TreeSystem";
import { LargeTex } from "../largeTex/LargeTex";

/**
 * 树木组合贴图
*/
export class TreeTexComb {
    static treePath = "res/layaverse/tree/";
    private _cmdBuffer = new CommandBuffer();
    private _taskNum = -1; //任务计数
    combTex: LargeTex; //组合纹理

    constructor(size: number, bark: string, stem: string, leaf: string, squama: string, flower: string) {
        //@ts-ignore
        this._cmdBuffer.context = RenderContext3D._instance;
        this._cmdBuffer.context.pipelineMode = "Forward";
        this.combTex = new LargeTex(size, size, RenderTargetFormat.R8G8B8A8, null, true, -1, false);
        this.combTex.cmdBuffer = this._cmdBuffer;
        this.combTex.lock = true;
        this._taskNum = 0;
        const s2 = size / 2;
        const s4 = size / 4;

        const _addRef = (url: string) => {
            const ref = TreeSystem.texRef.get(url);
            if (ref) TreeSystem.texRef.set(url, ref + 1);
            else TreeSystem.texRef.set(url, 1);
        };

        const _subRef = (url: string, tex: Texture2D) => {
            let ref = TreeSystem.texRef.get(url);
            if (ref) ref--;
            if (ref == undefined || ref == 0) {
                Laya.loader.clearRes(url, tex);
                if (ref != undefined)
                    TreeSystem.texRef.delete(url);
            } else TreeSystem.texRef.set(url, ref);
        };

        if (bark.length > 0) {
            this._taskNum++;
            const url = TreeTexComb.treePath + bark;
            _addRef(url);
            Laya.loader.load({ url, type: Loader.TEXTURE2D },
                Handler.create(this, (t: Texture2D) => {
                    if (t) {
                        this.combTex.addTexture(0, 0, s4, size, 0, t, false);
                        this.combTex.onUpdate(true);
                        _subRef(url, t);
                    } else console.log("bark error", bark);
                    this._taskNum--;
                }));
        }

        if (stem.length > 0) {
            this._taskNum++;
            const url = TreeTexComb.treePath + stem;
            _addRef(url);
            Laya.loader.load({ url, type: Loader.TEXTURE2D },
                Handler.create(this, (t: Texture2D) => {
                    if (t) {
                        this.combTex.addTexture(s4 + 1, 1, s4 - 2, s4 - 2, 0, t, false);
                        this.combTex.onUpdate(true);
                        _subRef(url, t);
                    } else console.log("stem error", stem);
                    this._taskNum--;
                }));
        }

        if (squama.length > 0) {
            this._taskNum++;
            const url = TreeTexComb.treePath + squama;
            _addRef(url);
            Laya.loader.load({ url, type: Loader.TEXTURE2D },
                Handler.create(this, (t: Texture2D) => {
                    if (t) {
                        this.combTex.addTexture(s4 + 1, s4 + 1, s4 - 2, s4 - 2, 0, t, false);
                        this.combTex.onUpdate(true);
                        _subRef(url, t);
                    } else console.log("squama error", bark);
                    this._taskNum--;
                }));
        }

        if (flower.length > 0) {
            this._taskNum++;
            const url = TreeTexComb.treePath + flower;
            _addRef(url);
            Laya.loader.load({ url, type: Loader.TEXTURE2D },
                Handler.create(this, (t: Texture2D) => {
                    if (t) {
                        this.combTex.addTexture(s4 + 1, s4 * 3 + 1, s4 - 2, s4 - 2, 0, t, false);
                        this.combTex.onUpdate(true);
                        _subRef(url, t);
                    } else console.log("flower error", flower);
                    this._taskNum--;
                }));
        }

        if (leaf.length > 0) {
            this._taskNum++;
            const url = TreeTexComb.treePath + leaf;
            _addRef(url);
            Laya.loader.load({ url, type: Loader.TEXTURE2D },
                Handler.create(this, (t: Texture2D) => {
                    if (t) {
                        this.combTex.addTexture(s2, 0, s2, size, 0, t, false);
                        this.combTex.onUpdate(true);
                        _subRef(url, t);
                    } else console.log("leaf error", leaf);
                    this._taskNum--;
                }));
        }
    }

    /**
     * 任务是否已经完成
     */
    isComplete() {
        return this._taskNum == 0 ? true : false;
    }

    /**
     * 销毁
     */
    destroy() {
        if (this._cmdBuffer) { //@ts-ignore
            this._cmdBuffer.clear();
            this._cmdBuffer = null;
        }
        if (this.combTex) {
            this.combTex.destroy();
            this.combTex = null;
        }
    }
}
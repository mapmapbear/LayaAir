import { Laya } from "Laya";
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { CommandBuffer } from "laya/d3/core/render/command/CommandBuffer";
import { RenderContext3D } from "laya/d3/core/render/RenderContext3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Vector2 } from "laya/maths/Vector2";
import { Vector3 } from "laya/maths/Vector3";
import { Vector4 } from "laya/maths/Vector4";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { RenderTexture } from "laya/resource/RenderTexture";
import { FilterMode } from "laya/RenderEngine/RenderEnum/FilterMode";
import { Texture2D } from "laya/resource/Texture2D";
import { TextureFormat } from "laya/RenderEngine/RenderEnum/TextureFormat";
import { WrapMode } from "laya/RenderEngine/RenderEnum/WrapMode";
import { LargeTex } from "./LargeTex";
import { RenderTargetFormat } from "laya/RenderEngine/RenderEnum/RenderTargetFormat";
import { CullMode } from "laya/RenderEngine/RenderEnum/CullMode";
import { TexMergeShaderInit } from "./shader/TexMergeShaderInit";
import { BlinnPhongMaterial } from "laya/d3/core/material/BlinnPhongMaterial";
import { Functions } from "../utils/Functions";

//被合并的纹理单元
export class TextureItem {
    id: number = 0;      //纹理唯一编号（0是空位，1是颜色块，>1是纹理块）
    url?: string;        //纹理URL（可选）
    x: number = 0;       //纹理坐标变换参数（X，Y是偏移量，W，H是缩放量）
    y: number = 0;
    w: number = 0;
    h: number = 0;
    n: number = 0;       //纹理张数
    pos = new Vector4(); //纹理所处大图合集位置和宽高（块坐标，非像素坐标）
    ltc: number = 0;     //大纹理序号
    scale: number = 1;   //放缩系数
    token: boolean = false; //是否仅是占位（需要用实际纹理替换）
    partId: number[] = [];  //伴随纹理id

    cloneTo(ti: TextureItem) {
        ti.id = this.id;
        ti.url = this.url;
        ti.x = this.x;
        ti.y = this.y;
        ti.w = this.w;
        ti.h = this.h;
        ti.n = this.n;
        ti.ltc = this.ltc;
        ti.scale = this.scale;
        ti.token = this.token;
        this.pos.cloneTo(ti.pos);
        ti.partId.length = this.partId.length;
        for (let i = 0; i < this.partId.length; i++)
            ti.partId[i] = this.partId[i];
    }

    /**
     * 是否是自身
     * @param iu id或url
     * @returns 
     */
    me(iu: number | string) {
        return (this.id === iu || this.url === iu);
    }

    /**
     * 是否是本组
     * @param tex 
     */
    meTexs(tex: Texture2D[]) {
        if (!tex) return false;
        if (tex.length != this.partId.length + 1) return false;
        if (tex[0].id != this.id) return false;
        for (let i = 0; i < this.partId.length; i++)
            if (tex[i + 1].id != this.partId[i]) return false;
        return true;
    }
}

//被合并的颜色单元
type ColorItem = {
    u?: number; //在大纹理中的UV坐标
    v?: number;
    r?: number; //rgba颜色值
    g?: number;
    b?: number;
    a?: number;
    ltc?: number; //合并的大纹理序号
}

//合并后的大纹理
export type TextureOut = {
    texture?: LargeTex; //大纹理对象
    texCode?: number; //大纹理序号
}

//大图合集基类
export class LargeTexBase {
    EXTEND_SIZE: number = 0;     //纹理扩边量（可减少黑边）
    TEX_SIZE_MIN: number = 16;   //纹理单元尺寸，查找纹理空位时的步长，小纹理合成到大纹理后，占用的最小像素尺寸为 TEX_SIZE_MIN * TEX_SIZE_MIN
    TEX_SIZE_MAX: number = 1024; //参与合并的小纹理最大允许尺寸，超过这个尺寸将不参与合并
    TEX_GROUP_MAX: number = 2;   //成组纹理的最大数量（1~4张）
    mipMap: boolean = true;      //是否启用MipMap
    texWrap = WrapMode.Clamp;    //纹理重复模式
    texMode = FilterMode.Trilinear; //纹理采样模式
    texAnisoLevel = 1;              //各向异性值
    texFormat = RenderTargetFormat.R8G8B8A8; //大纹理像素格式
    backColor = new Vector4(90, 90, 90, 255); //背景色

    LARGE_TEX_W: number = 2048; //大纹理宽度
    LARGE_TEX_H: number = 2048; //大纹理高度
    LARGE_TEX_N: number = 32; //大纹理最大数量

    qds: number = 0; //显示节点尺寸
    loadAll: number = 0; //总容量
    loadUse: number = 0; //已经使用的容量
    pbrUse: boolean = false; //是否是PBR使用模式（奇数sRGB，偶数RGB）
    sRGB: boolean = false; //是否sRGB空间
    checkDup: boolean = true; //是否查重
    autoExtend: boolean = false; //自动扩展大图数量
    immediately: boolean = false; //是否立即执行合并

    protected _texItems: TextureItem[][] = []; //参与合并的纹理对象数组
    protected _texMaps: number[][] = []; //大纹理中位置占用情况的Map，尺寸为 (LARGE_TEX_SIZE / TEX_SIZE_MIN) ^ 2，默认为0，占用的位置放纹理id

    largeTex: LargeTex[] = []; //合并的大纹理对象
    protected _cmdBuffer = new CommandBuffer();

    destroyed: boolean = false;
    gpuMemory: number = 0; //显存使用量

    id: number; //大图合集id
    name: string; //大图合集名称

    //用于将合并后的纹理显示出来（测试功能用）
    spriteRoot: Sprite3D = new Sprite3D(); //根节点
    protected _sprites: MeshSprite3D[] = []; //大纹理节点

    //可选的大纹理尺寸
    protected static _largeTexSize = [
        [8, 8],
        [16, 8],
        [8, 16],
        [16, 16],
        [32, 16],
        [16, 32],
        [32, 32],
        [64, 32],
        [32, 64],
        [64, 64],
        [128, 64],
        [64, 128],
        [128, 128],
        [256, 128],
        [128, 256],
        [256, 256],
        [512, 256],
        [256, 512],
        [512, 512],
        [1024, 512],
        [512, 1024],
        [1024, 1024],
        [2048, 1024],
        [1024, 2048],
        [2048, 2048],
    ];

    /**
     * 构造函数
     * @param lts 大纹理像素尺寸（尺寸要符合2次幂）
     * @param ltn 大纹理数量上限
     * @param tsm 小纹理单元尺寸（小纹理最小尺寸）
     * @param exs 小纹理扩边尺寸
     * @param qds 大纹理观察尺寸
     */
    constructor(lts: number[], ltn: number, tsm: number = 16, exs: number = 0, qds: number = 0, texFormat?: RenderTargetFormat) {
        if (lts[0]) {
            this.LARGE_TEX_W = lts[0];
            if (lts[1])
                this.LARGE_TEX_H = lts[1];
            else this.LARGE_TEX_H = lts[0];
        }
        this.EXTEND_SIZE = exs;
        this.LARGE_TEX_N = ltn;
        this.TEX_SIZE_MIN = tsm;
        this.qds = qds;
        if (texFormat) this.texFormat = texFormat;
        const nw = this.LARGE_TEX_W / this.TEX_SIZE_MIN | 0;
        const nh = this.LARGE_TEX_H / this.TEX_SIZE_MIN | 0;
        this.loadAll = nw * nh * ltn;
        for (let i = 0; i < ltn; i++) {
            this._texItems[i] = [];
            this._texMaps[i] = new Array<number>(nw * nh).fill(0);
            if (qds > 0) {
                this._sprites[i] = new MeshSprite3D(PrimitiveMesh.createQuad(qds, qds * this.LARGE_TEX_H / this.LARGE_TEX_W));
                this._sprites[i].meshRenderer.material = new BlinnPhongMaterial();
                this._sprites[i].meshRenderer.material.cull = CullMode.Off;
                this._sprites[i].meshRenderer.material.alphaTest = false;
                this._sprites[i].transform.localPositionX = 0;
                this._sprites[i].transform.localPositionY = qds * 0.5;
                this._sprites[i].transform.localPositionZ = -qds * 0.5 * i;
                this.spriteRoot.addChild(this._sprites[i]);
            }
        }

        TexMergeShaderInit.init(); //@ts-ignore
        this._cmdBuffer.context = RenderContext3D._instance;
        this._cmdBuffer.context.pipelineMode = "Forward";
    }

    /**
     * 响应更新
     * @param force 强制更新
     */
    onUpdate(force: boolean = false) {
        if (!this.largeTex)
            return false;
        for (let i = 0, len = this.largeTex.length; i < len; i++) {
            const o: LargeTex = this.largeTex[i];
            if (!o) continue;
            o.onUpdate(force);
            if (!force && Laya.stage.getTimeFromFrameStart() > 30) break;
        }
        return true;
    }

    /**
     * 调整大纹理数量上限
     * @param add 增加量
     */
    adjustLtn(add?: number) {
        if (add == undefined)
            add = this.TEX_GROUP_MAX;
        if (add > 0) {
            const qds = this.qds;
            const nw = this.LARGE_TEX_W / this.TEX_SIZE_MIN | 0;
            const nh = this.LARGE_TEX_H / this.TEX_SIZE_MIN | 0;
            const ltn = this.LARGE_TEX_N + add;
            this.loadAll = nw * nh * ltn;
            for (let i = this.LARGE_TEX_N; i < ltn; i++) {
                this._texItems[i] = [];
                this._texMaps[i] = new Array<number>(nw * nh).fill(0);
                if (qds > 0) {
                    this._sprites[i] = new MeshSprite3D(PrimitiveMesh.createQuad(qds, qds * this.LARGE_TEX_H / this.LARGE_TEX_W));
                    this._sprites[i].meshRenderer.material = new BlinnPhongMaterial();
                    this._sprites[i].transform.localPositionX = qds * 0.5;
                    this._sprites[i].transform.localPositionY = qds * 1.5;
                    this._sprites[i].transform.localPositionZ = -qds * 0.5 * i;
                    this.spriteRoot.addChild(this._sprites[i]);
                }
            }
            this.LARGE_TEX_N += add;
        }
    }

    /**
     * 统计显存使用量
     */
    staticGpuMemory() {
        this.gpuMemory = 0;
        for (let i = this.largeTex.length - 1; i > -1; i--) //@ts-ignore
            this.gpuMemory += this.largeTex[i]._renderTarget.gpuMemory;
        return this.gpuMemory;
    }

    /**
     * 获取当前使用率（百分比）
     * @returns 
     */
    getLoadRate() {
        return this.loadUse / this.loadAll;
    }

    /**
     * 大图指定位置用颜色填充
     * @param ltc 大纹理序号
     * @param x 位置x
     * @param y 位置y
     * @param w 宽度
     * @param h 高度
     * @param r 红色成分（0~255）
     * @param g 绿色成分（0~255）
     * @param b 蓝色成分（0~255）
     * @param a Alpha（0~255）
     */
    fillByColor(ltc: number, x: number, y: number, w: number, h: number, r: number, g: number, b: number, a: number = 255) {
        if (ltc < this.LARGE_TEX_N && this.largeTex[ltc]) {
            const tex = new Texture2D(1, 1, TextureFormat.R8G8B8A8, false, false);
            const data = new Uint8Array([r, g, b, a]);
            tex.setPixelsData(data, false, false);
            this.largeTex[ltc].addTexture(x, y, w, h, 0, tex, true);
        }
    }

    /**
     * 根据一批小纹理计算大纹理尺寸和高宽
     * @param tex 
     * @param scale 
     * @param tsm
     * @param exs
     * @param tp 合并情况
     * @returns [宽，高，利用率]
     */
    static calcFitTexSize(tex: Texture2D[], scale: number, tsm: number, exs: number, tp?: any) {
        if (!tex || tex.length == 0) return [0];
        const size = LargeTexBase._largeTexSize;
        for (let i = 0, len = size.length; i < len; i++) {
            if (tp) tp.length = 0;
            let sum = 0;
            let count = 0;
            const nw = (size[i][0] / tsm) | 0;
            const nh = (size[i][1] / tsm) | 0;
            const texMap = new Array(nw * nh).fill(0);
            for (let j = 0, len = tex.length; j < len; j++) {
                const ss = LargeTexBase.calcTexSize(tex[j].width, tex[j].height, scale, tsm, exs);
                const sx = ss[2], sy = ss[3];

                let find = false;
                for (let k = 0; k < nh - sy + 1 && !find; k++) {
                    for (let l = 0; l < nw - sx + 1 && !find; l++) {
                        if (texMap[k * nw + l] > 0) continue;
                        let fail = false;
                        for (let m = k; m < k + sy && !fail; m++)
                            for (let n = l; n < l + sx && !fail; n++)
                                if (texMap[m * nw + n] > 0)
                                    fail = true;
                        if (!fail) {
                            for (let m = k; m < k + sy; m++) {
                                for (let n = l; n < l + sx; n++) {
                                    texMap[m * nw + n] = 1;
                                    count++;
                                }
                            }
                            sum++;
                            find = true;
                            if (tp) tp.push([l, k, sx, sy]);
                        }
                    }
                }
                if (!find) break;
            }
            if (sum == tex.length)
                return [size[i][0], size[i][1], count * 100 / nw / nh | 0];
        }
        return [0];
    }

    /**
     * 指定的贴图是否都已经合并
     * @param tex 贴图组
     */
    isAllIn(tex: Texture2D[]) {
        if (tex) {
            for (let i = tex.length - 1; i > -1; i--) {
                let find = false;
                for (let j = 0; j < this.LARGE_TEX_N; j += 2) {
                    if (this._findTextureSingle(tex[i].id, j)) {
                        find = true;
                        break;
                    }
                }
                if (!find) return false;
            }
            return true;
        }
        return false;
    }

    /**
     * 大图合集指定纹理空间是否够用
     * @param tex 小纹理数组
     * @param scale 放缩系数
     * @param ltc 大纹理序号
     * @return 够用true，不够用false
     */
    isSpaceEnough(tex: Texture2D[], scale: number, ltc: number) {
        if (!tex || tex.length == 0
            || ltc < 0 || ltc >= this.LARGE_TEX_N) return false;
        const texMap = [[]];
        const nw = (this.LARGE_TEX_W / this.TEX_SIZE_MIN) | 0;
        const nh = (this.LARGE_TEX_H / this.TEX_SIZE_MIN) | 0;
        for (let j = 0; j < nh; j++)
            for (let i = 0; i < nw; i++)
                texMap[0][j * nw + i] = this._texMaps[ltc][j * nw + i];
        for (let i = 0, len = tex.length; i < len; i++) {
            if (!tex[i]) continue;
            const ti = this._findTextureSingle(tex[i].id, ltc);
            if (ti) continue;
            const ss = LargeTexBase.calcTexSize(tex[i].width, tex[i].height, scale, this.TEX_SIZE_MIN, this.EXTEND_SIZE);
            if (!this._takeRoomInMap(ss[2], ss[3], 1, 0, texMap)) return false;
        }
        return true;
    }

    /**
     * 获取具有足够空间的大纹理编号
     * @param tex 小纹理数组
     * @param scale 放缩系数
     * @return 成功大纹理编号，失败-1
     */
    getSpaceEnoughLTC(tex: Texture2D[], scale: number) {
        for (let i = 0; i < this.LARGE_TEX_N; i++)
            if (this.isSpaceEnough(tex, scale, i))
                return i;
        return -1;
    }

    /**
     * 将一组小纹理合并到指定的大纹理中
     * @param tex 小纹理数组
     * @param scale 放缩系数
     * @param ltc 大纹理编号
     * @param needRemove 小纹理用完后是否需要删除
     * @param version 材质系统版本
     * @return 成功true，失败false，如果失败，所有的小纹理都没有合并进大纹理中
     */
    addTexturesLTC(tex: Texture2D[], scale: number, ltc: number, needRemove: boolean = false, version: number = 3) {
        const space = this.isSpaceEnough(tex, scale, ltc);
        if (!space) return false;
        for (let i = 0, len = tex.length; i < len; i++)
            this.addTexture([tex[i]], scale, ltc, null, needRemove, version);
        return true;
    }

    /**
     * 添加小纹理
     * @param tex 纹理对象数组（1~4张，以第一张图尺寸为准，其他图会被缩放）
     * @param scale 放缩系数（0.1~10.0）
     * @param ltc 指定大图纹理编号（-1：不指定）
     * @param url 纹理URL
     * @param needRemove 小纹理用完后是否需要删除
     * @param version 材质系统版本
     * @returns 成功大纹理编号，失败-1
     */
    addTexture(tex: Texture2D[], scale: number = 1, ltc: number = -1, url: string = null, needRemove: boolean = false, version: number = 3) {
        if (tex && tex[0]) {
            const t0: any = tex[0];
            const w = (t0.real || t0.real == undefined ? t0.width : t0.t_w) * scale | 0;
            const h = (t0.real || t0.real == undefined ? t0.height : t0.t_h) * scale | 0;
            if (w > this.LARGE_TEX_W - this.EXTEND_SIZE * 2
                || h > this.LARGE_TEX_H - this.EXTEND_SIZE * 2) {
                console.warn("LargeTexManager: the texture is too large1!");
                return -1;
            }
            if (w > this.TEX_SIZE_MAX || h > this.TEX_SIZE_MAX) {
                console.warn("LargeTexManager: the texture is too large2!");
                return -1;
            }
            const ti = this._addTexture(tex, scale, ltc, url, needRemove, version);
            if (!ti) {
                console.warn("LargeTexManager: have not enough room!");
                return -1;
            }
            return ti.ltc;
        }
        return -1;
    }

    /**
     * 添加小纹理占位
     * @param url 纹理资源
     * @param w 纹理宽度
     * @param h 纹理高度
     * @param n 纹理张数（1~4张）
     * @param scale 放缩系数（0.1~10.0）
     * @param ltc 指定大图纹理编号（-1：不指定）
     * @returns
     */
    addTextureToken(url: string, w: number, h: number, n: number, scale: number = 1, ltc: number = -1) {
        const w1 = w * scale | 0;
        const h1 = h * scale | 0;
        if (w1 > this.LARGE_TEX_W - this.EXTEND_SIZE * 2
            || h1 > this.LARGE_TEX_H - this.EXTEND_SIZE * 2) {
            console.warn("LargeTexManager: the texture is too large1!");
            return -1;
        }
        if (w1 > this.TEX_SIZE_MAX || h1 > this.TEX_SIZE_MAX) {
            console.warn("LargeTexManager: the texture is too large2!");
            return -1;
        }
        const ti = this._addTextureToken(url, w, h, n, scale, ltc);
        if (!ti) {
            console.warn("LargeTexManager: have not enough room!");
            return -1;
        }
        return ti.ltc;
    }

    /**
     * 更新小纹理
     * @param tex 纹理对象数组（1~4张，以第一张图尺寸为准，其他图会被缩放）
     * @param scale 放缩系数（0.1~10.0）
     * @param ltc 指定大图纹理编号（-1：不指定）
     * @param url 纹理URL
     * @param needRemove 小纹理用完后是否需要删除
     * @returns 成功大纹理编号，失败-1
     */
    updateTexture(tex: Texture2D[], scale: number = 1, ltc: number = -1, url?: string, needRemove: boolean = false) {
        if (tex && tex[0]) {
            const ti = this._updateTexture(tex, scale, ltc, url, needRemove);
            if (!ti) {
                console.warn("LargeTexManager: not found texture to update!");
                return -1;
            }
            return ti.ltc;
        }
        return -1;
    }

    /**
     * 获取纹理和UV
     * @param iu 小纹理id或url
     * @param uv 获取纹理变换参数（null表示不获取）
     * @param ltc 大纹理编号
     * @returns 纹理对象
     */
    getTextureSingle(iu: number | string, uv: Vector4, ltc: number = -1) {
        const ti = this._findTextureSingle(iu, ltc);
        if (ti) {
            if (uv) {
                uv.x = ti.x;
                uv.y = ti.y;
                uv.z = ti.w;
                uv.w = ti.h;
            }
            const to: TextureOut = {};
            to.texture = this.largeTex[ti.ltc];
            to.texCode = ti.ltc;
            return to;
        }
        return null;
    }

    /**
     * 获取纹理和UV
     * @param tex 纹理组
     * @param uv 获取纹理变换参数（null表示不获取）
     * @param ltc 大纹理编号
     * @returns 纹理对象
     */
    getTexture(tex: Texture2D[], uv: Vector4, ltc: number = -1) {
        const ti = this._findTexture(tex, ltc);
        if (ti) {
            if (uv) {
                uv.x = ti.x;
                uv.y = ti.y;
                uv.z = ti.w;
                uv.w = ti.h;
            }
            const to: TextureOut = {};
            to.texture = this.largeTex[ti.ltc];
            to.texCode = ti.ltc;
            return to;
        }
        return null;
    }

    /**
     * 根据大图纹理序号获取大纹理
     * @param ltc 大纹理编号
     * @returns 大纹理或null
     */
    getLargeTex(ltc: number) {
        if (ltc >= 0 && ltc < this.largeTex.length)
            return this.largeTex[ltc];
        return null;
    }

    /**
     * 删除小纹理
     * @param iu 小纹理id或url
     * @param ltc 大纹理编号(-1: 不指定)
     */
    delTexture(iu: number | string, ltc: number = -1) {
        if (!this._texItems) return;
        const nw = this.LARGE_TEX_W / this.TEX_SIZE_MIN;
        let sx = 0, sy = 0, ex = 0, ey = 0;
        if (ltc >= 0) {
            if (ltc < this.LARGE_TEX_N) {
                const texItems = this._texItems[ltc];
                let texMaps = this._texMaps[ltc];
                for (let i = texItems.length - 1; i > -1; i--) {
                    if (texItems[i].me(iu)) {
                        const ti = texItems[i];
                        ltc = ti.ltc;
                        sx = ti.pos.x;
                        sy = ti.pos.y;
                        ex = ti.pos.z + sx;
                        ey = ti.pos.w + sy;
                        for (let k = 0; k < ti.n; k++) {
                            texMaps = this._texMaps[ltc + k];
                            for (let j = sy; j < ey; j++)
                                for (let k = sx; k < ex; k++)
                                    texMaps[j * nw + k] = 0;
                            this.fillByColor(ltc + k, sx * this.TEX_SIZE_MIN, sy * this.TEX_SIZE_MIN,
                                ti.pos.z * this.TEX_SIZE_MIN, ti.pos.w * this.TEX_SIZE_MIN,
                                this.backColor.x, this.backColor.y, this.backColor.z, this.backColor.w);
                        }
                        texItems.splice(i, 1);
                        this.loadUse -= ti.pos.z * ti.pos.w * ti.n;
                    }
                }
            }
        }
        else {
            for (let i = 0; i < this.LARGE_TEX_N; i++)
                this.delTexture(iu, i);
        }
    }

    /**
     * 清空，重用对象
     */
    empty() {
        for (let i = this.largeTex.length - 1; i > -1; i--)
            if (this.largeTex[i])
                this.largeTex[i].destroy();
        this.largeTex.length = 0;
        const nw = this.LARGE_TEX_W / this.TEX_SIZE_MIN | 0;
        const nh = this.LARGE_TEX_H / this.TEX_SIZE_MIN | 0;
        for (let i = 0; i < this.LARGE_TEX_N; i++) {
            this._texItems[i].length = 0;
            this._texMaps[i] = new Array<number>(nw * nh).fill(0);
        }
        this.loadUse = 0; //@ts-ignore
        this._cmdBuffer.clear();
    }

    /**
     * 销毁对象，清理内存
     * @param keepRes
     */
    destroy(keepRes: boolean = false) {
        if (this.destroyed) return;
        for (let i = 0; i < this.largeTex.length; i++)
            if (this.largeTex[i]) {
                if (!keepRes)
                    this.largeTex[i].destroy();
                else this.largeTex[i].lock = false;
            }
        this.largeTex = null;
        this._texMaps = null;
        this._texItems = null;
        for (let i = 0; i < this._sprites.length; i++) {
            this._sprites[i].meshFilter.sharedMesh.destroy();
            this._sprites[i].destroy();
        }
        this._sprites = null;
        if (this.spriteRoot)
            this.spriteRoot.destroy(); //@ts-ignore
        this._cmdBuffer.clear();
        this._cmdBuffer = null;
        this.destroyed = true;
    }

    /**
     * 通过id或url查找小纹理参数/占位
     * @param iu 小纹理id或url
     * @param ltc 大纹理编号（-1：不指定）
     * @returns 小纹理信息
     */
    protected _findTextureSingle(iu: number | string, ltc: number = -1) {
        if (ltc >= 0) {
            if (ltc < this.LARGE_TEX_N) {
                const texItems = this._texItems[ltc];
                const len = texItems.length;
                for (let i = 0; i < len; i++)
                    if (texItems[i].me(iu))
                        return texItems[i];
            }
        }
        else {
            for (let j = 0; j < this.LARGE_TEX_N; j += this.TEX_GROUP_MAX) {
                const texItems = this._texItems[j];
                const len = texItems.length;
                for (let i = 0; i < len; i++)
                    if (texItems[i].me(iu))
                        return texItems[i];
            }
        }
        return null;
    }

    /**
     * 通过id或url查找小纹理参数/占位
     * @param tex 小纹理组
     * @param ltc 大纹理编号（-1：不指定）
     * @returns 小纹理信息
     */
    protected _findTexture(tex: Texture2D[], ltc: number = -1) {
        if (ltc >= 0) {
            if (ltc < this.LARGE_TEX_N) {
                const texItems = this._texItems[ltc];
                const len = texItems.length;
                for (let i = 0; i < len; i++)
                    if (texItems[i].meTexs(tex))
                        return texItems[i];
            }
        }
        else {
            for (let j = 0; j < this.LARGE_TEX_N; j += this.TEX_GROUP_MAX) {
                const texItems = this._texItems[j];
                const len = texItems.length;
                for (let i = 0; i < len; i++)
                    if (texItems[i].meTexs(tex))
                        return texItems[i];
            }
        }
        return null;
    }

    /**
     * 清除所有纹理
     */
    removeAllTexture() {
        const nw = this.LARGE_TEX_W / this.TEX_SIZE_MIN;
        const nh = this.LARGE_TEX_H / this.TEX_SIZE_MIN;
        for (let i = 0; i < this.LARGE_TEX_N; i++) {
            for (let j = 0; j < nh; j++)
                for (let k = 0; k < nw; k++)
                    this._texMaps[i][j * nw + k] = 0;
            this.largeTex[i] = null;
            this._texItems[i].length = 0;
            this.spriteRoot.removeChild(this._sprites[i]);
            this._sprites[i] = null;
        }
        this.loadUse = 0;
    }

    /**
     * 创建大纹理
     * @param ltc 大纹理编号
     * @param sRGB 大图是否sRGB格式
     */
    createLargeTex(ltc: number, sRGB?: boolean) {
        const mipMap = this.mipMap;
        const texMode = this.texMode;
        const anisoLevel = this.texAnisoLevel;
        const lastRT = RenderTexture.currentActive;
        sRGB = sRGB ? sRGB : this.sRGB;
        if (this.pbrUse) { //是否PBR模式
            if (ltc % 2 == 0)
                sRGB = true;
            else sRGB = false;
        }
        if (ltc >= 0 && ltc < this.LARGE_TEX_N) {
            if (!this.largeTex[ltc]) {
                const lt = new LargeTex(this.LARGE_TEX_W, this.LARGE_TEX_H, this.texFormat, null, mipMap, 4, sRGB);
                lt.lock = true;
                lt.filterMode = texMode;
                lt.anisoLevel = anisoLevel;
                lt.wrapModeU = this.texWrap;
                lt.wrapModeV = this.texWrap;
                lt.cmdBuffer = this._cmdBuffer;
                lt.immediately = this.immediately;
                lt.name = this.name;
                this.largeTex[ltc] = lt;
                if (this._sprites[ltc])
                    (<BlinnPhongMaterial>this._sprites[ltc].meshRenderer.material).albedoTexture = lt;

                //填充底色
                if (this.backColor.x > 0 || this.backColor.y > 0 || this.backColor.z > 0 || this.backColor.w > 0)
                    this.fillByColor(ltc, 0, 0, this.LARGE_TEX_W, this.LARGE_TEX_H,
                        this.backColor.x, this.backColor.y, this.backColor.z, this.backColor.w);
            }
        }
        if (lastRT)
            lastRT._start();
    }

    /**
     * 计算纹理分块尺寸
     * @param tw 纹理宽度
     * @param th 纹理高度
     * @param scale 放缩系数
     * @param tsm 最小尺寸
     * @param exs 边缘扩展
     * @returns [宽，高，水平块数，垂直块数]
     */
    static calcTexSize(tw: number, th: number, scale: number, tsm: number, exs: number) {
        const w = (tw * scale) | 0;
        const h = (th * scale) | 0;
        let sx = (w + exs * 2) / tsm;
        let sy = (h + exs * 2) / tsm;
        if (sx != (sx | 0)) sx = (sx | 0) + 1;
        if (sy != (sy | 0)) sy = (sy | 0) + 1;
        return [w, h, sx, sy];
    }

    /**
     * 添加小纹理，合成大纹理
     * @param tex 小纹理
     * @param scale 放缩系数
     * @param ltc 指定大纹理序号（-1：不指定）
     * @param url 纹理URL
     * @param needRemove 小纹理用完后是否需要删除
     * @param version 材质系统版本
     * @returns 
     */
    protected _addTexture(tex: Texture2D[], scale: number, ltc: number = -1, url: string = null, needRemove: boolean = false, version: number = 3) {
        if (tex.length == 0) return null;

        let ti = null;
        if (this.checkDup) {
            ti = this._findTexture(tex, ltc);
            if (ti && !ti.token) return ti;
        }

        const nw = this.LARGE_TEX_W / this.TEX_SIZE_MIN | 0;

        if (ti && ti.token) { //有纹理占位，换成实际纹理
            if (tex.length == ti.n) {
                ti.token = false;
                ti.id = tex[0].id;
                ti.partId.length = tex.length - 1;
                const x1 = ti.pos.x + ti.pos.z;
                const y1 = ti.pos.y + ti.pos.w;
                const tw = ti.w * this.LARGE_TEX_W;
                const th = ti.h * this.LARGE_TEX_H;
                for (let i = 0; i < tex.length; i++) {
                    ltc = ti.ltc + i;
                    if (i > 0) ti.partId[i - 1] = tex[i].id;
                    for (let j = ti.pos.y; j < y1; j++)
                        for (let k = ti.pos.x; k < x1; k++)
                            this._texMaps[ltc][j * nw + k] = ti.id;
                    if (!this.largeTex[ltc])
                        this.createLargeTex(ltc);
                    this.largeTex[ltc].addTexture(this.TEX_SIZE_MIN * ti.pos.x + this.EXTEND_SIZE,
                        this.TEX_SIZE_MIN * ti.pos.y + this.EXTEND_SIZE, tw, th, this.EXTEND_SIZE, tex[i], needRemove, version);
                }
                return ti;
            }
        } else {
            let t0: any = tex[0];
            const w = t0.real || t0.real == undefined ? t0.width : t0.t_w;
            const h = t0.real || t0.real == undefined ? t0.height : t0.t_h;
            const ss = LargeTexBase.calcTexSize(w, h, scale, this.TEX_SIZE_MIN, this.EXTEND_SIZE);
            let room = this._findRoom(ss[2], ss[3], tex.length, ltc);
            if (room[0] < 0 && this.autoExtend) {
                this.adjustLtn();
                room = this._findRoom(ss[2], ss[3], tex.length, ltc);
            }
            if (room[0] >= 0) {
                const ti = new TextureItem();
                ti.id = tex[0].id;
                ti.ltc = room[0];
                ti.x = (room[2] * this.TEX_SIZE_MIN + this.EXTEND_SIZE) / this.LARGE_TEX_W;
                ti.y = (room[1] * this.TEX_SIZE_MIN + this.EXTEND_SIZE) / this.LARGE_TEX_H;
                ti.w = ss[0] / this.LARGE_TEX_W;
                ti.h = ss[1] / this.LARGE_TEX_H;
                ti.n = tex.length;
                ti.pos.x = room[2];
                ti.pos.y = room[1];
                ti.pos.z = ss[2];
                ti.pos.w = ss[3];
                ti.scale = scale;
                ti.partId.length = tex.length - 1;
                if (url) ti.url = url;
                this._addToTextureItem(ti);
                this.loadUse += ss[2] * ss[3] * tex.length;

                const x1 = room[2] + ss[2];
                const y1 = room[1] + ss[3];
                for (let i = 0; i < tex.length; i++) {
                    ltc = ti.ltc + i;
                    if (i > 0) ti.partId[i - 1] = tex[i].id;
                    for (let j = room[1]; j < y1; j++)
                        for (let k = room[2]; k < x1; k++)
                            this._texMaps[ltc][j * nw + k] = ti.id;
                    if (!this.largeTex[ltc])
                        this.createLargeTex(ltc);
                    this.largeTex[ltc].addTexture(this.TEX_SIZE_MIN * room[2] + this.EXTEND_SIZE,
                        this.TEX_SIZE_MIN * room[1] + this.EXTEND_SIZE, ss[0], ss[1], this.EXTEND_SIZE, tex[i], needRemove, version);
                }
                return ti;
            }
        }
        return null;
    }

    /**
     * 添加纹理占位
     * @param url 纹理资源
     * @param w 纹理宽度
     * @param h 纹理高度
     * @param n 纹理张数（1~4张）
     * @param scale 放缩系数（0.1~10.0）
     * @param ltc 指定大图纹理编号（-1：不指定）
     * @returns 纹理占位对象
     */
    protected _addTextureToken(url: string, w: number, h: number, n: number, scale: number = 1, ltc: number = -1) {
        const ti = this._findTextureSingle(url, ltc);
        if (ti) return ti;

        const ss = LargeTexBase.calcTexSize(w, h, scale, this.TEX_SIZE_MIN, this.EXTEND_SIZE);
        let room = this._findRoom(ss[2], ss[3], n, ltc);
        if (room[0] < 0 && this.autoExtend) {
            this.adjustLtn();
            room = this._findRoom(ss[2], ss[3], n, ltc);
        }

        if (room[0] >= 0) {
            const ti = new TextureItem();
            ti.ltc = room[0];
            ti.x = (room[2] * this.TEX_SIZE_MIN + this.EXTEND_SIZE) / this.LARGE_TEX_W;
            ti.y = (room[1] * this.TEX_SIZE_MIN + this.EXTEND_SIZE) / this.LARGE_TEX_H;
            ti.w = ss[0] / this.LARGE_TEX_W;
            ti.h = ss[1] / this.LARGE_TEX_H;
            ti.n = n;
            ti.pos.x = room[2];
            ti.pos.y = room[1];
            ti.pos.z = ss[2];
            ti.pos.w = ss[3];
            ti.scale = scale;
            ti.token = true;
            if (url) ti.url = url;
            this._addToTextureItem(ti);
            this.loadUse += ss[2] * ss[3] * n;

            const nw = this.LARGE_TEX_W / this.TEX_SIZE_MIN | 0;
            const ltc = ti.ltc;
            const x1 = room[2] + ss[2];
            const y1 = room[1] + ss[3];
            for (let i = 0; i < n; i++) {
                for (let j = room[1]; j < y1; j++)
                    for (let k = room[2]; k < x1; k++)
                        this._texMaps[ltc + i][j * nw + k] = 0x7fffffff;
            }
            return ti;
        }
        return null;
    }

    /**
     * 更新小纹理，合成大纹理
     * @param tex 小纹理
     * @param scale 放缩系数
     * @param ltc 指定大纹理序号（-1：不指定）
     * @param url 纹理URL
     * @param needRemove 小纹理用完后是否需要删除
     * @param version 材质系统版本
     * @returns 
     */
    protected _updateTexture(tex: Texture2D[], scale: number, ltc: number = -1, url: string = null, needRemove: boolean = false, version: number = 3) {
        if (tex.length == 0) return null;

        const ti = this._findTexture(tex, ltc);
        if (!ti || ti.n != tex.length || ti.scale != scale) return null;
        let t0: any = tex[0];

        const w = t0.real || t0.real == undefined ? t0.width : t0.t_w;
        const h = t0.real || t0.real == undefined ? t0.height : t0.t_h;
        const ss = LargeTexBase.calcTexSize(w, h, scale, this.TEX_SIZE_MIN, this.EXTEND_SIZE);
        if (ti.pos.z != ss[2] || ti.pos.w != ss[3]) return null;

        const nw = this.LARGE_TEX_W / this.TEX_SIZE_MIN | 0;

        if (ti.token) { //有纹理占位，换成实际纹理
            ti.token = false;
            ti.id = tex[0].id;
            ti.partId.length = tex.length - 1;
            const x1 = ti.pos.x + ti.pos.z;
            const y1 = ti.pos.y + ti.pos.w;
            const tw = ti.w * this.LARGE_TEX_W;
            const th = ti.h * this.LARGE_TEX_H;
            for (let i = 0; i < tex.length; i++) {
                ltc = ti.ltc + i;
                if (i > 0) ti.partId[i - 1] = tex[i].id;
                for (let j = ti.pos.y; j < y1; j++)
                    for (let k = ti.pos.x; k < x1; k++)
                        this._texMaps[ltc][j * nw + k] = ti.id;
                if (!this.largeTex[ltc])
                    this.createLargeTex(ltc);
                this.largeTex[ltc].addTexture(this.TEX_SIZE_MIN * ti.pos.x + this.EXTEND_SIZE,
                    this.TEX_SIZE_MIN * ti.pos.y + this.EXTEND_SIZE, tw, th, this.EXTEND_SIZE, tex[i], needRemove, version);
            }
            return ti;
        } else {
            ti.id = tex[0].id;
            ti.partId.length = tex.length - 1;
            if (url) ti.url = url;
            for (let i = 0; i < tex.length; i++) {
                ltc = ti.ltc + i;
                if (i > 0) ti.partId[i - 1] = tex[i].id;
                if (!this.largeTex[ltc])
                    this.createLargeTex(ltc);
                this.largeTex[ltc].addTexture(this.TEX_SIZE_MIN * ti.pos.x + this.EXTEND_SIZE,
                    this.TEX_SIZE_MIN * ti.pos.y + this.EXTEND_SIZE, ss[0], ss[1], this.EXTEND_SIZE, tex[i], needRemove, version);
            }
            return ti;
        }
    }

    /**
     * 查询并占据单张纹理的空间（指定Map）
     * @param x 纹理的尺寸x方向
     * @param y 纹理的尺寸y方向
     * @param n 纹理的张数
     * @param ltc 大图序号
     * @param texMap 空间占用图
     * @returns 成功true，失败false
     */
    protected _takeRoomInMap(x: number, y: number, n: number, ltc: number, texMap: number[][]) {
        const nw = this.LARGE_TEX_W / this.TEX_SIZE_MIN | 0;
        const room = this._peekRoomInMap(x, y, n, ltc, texMap);
        if (room[0] < 0) return false;
        const i0 = room[1];
        const j0 = room[0];
        const i1 = x + room[1];
        const j1 = y + room[0];
        for (let j = j0; j < j1; j++)
            for (let i = i0; i < i1; i++)
                for (let k = 0; k < n; k++)
                    texMap[ltc + k][j * nw + i] = 0x7fffffff;
        return true;
    }

    /**
     * 查询单张纹理的空间（指定Map）
     * @param x 纹理的尺寸x方向
     * @param y 纹理的尺寸y方向
     * @param n 纹理的张数
     * @param ltc 大图序号
     * @param texMap 空间占用图
     * @returns 空间位置[垂值位置，水平位置]
     */
    protected _peekRoomInMap(x: number, y: number, n: number, ltc: number, texMap: number[][]) {
        const nw = this.LARGE_TEX_W / this.TEX_SIZE_MIN | 0;
        const nh = this.LARGE_TEX_H / this.TEX_SIZE_MIN | 0;
        for (let j = 0; j < nh - y + 1; j++) {
            for (let i = 0; i < nw - x + 1; i++) {
                let fail = false;
                for (let k = 0; k < n; k++)
                    if (texMap[ltc + k][j * nw + i] > 0)
                        fail = true;
                if (fail) continue;
                for (let m = j; m < j + y && !fail; m++) {
                    for (let l = i; l < i + x && !fail; l++) {
                        for (let k = 0; k < n; k++)
                            if (texMap[ltc + k][m * nw + l] > 0)
                                fail = true;
                    }
                }
                if (!fail) return [j, i];
            }
        }
        return [-1, -1];
    }

    /**
     * 查询纹理的空间
     * @param x 纹理的尺寸x方向
     * @param y 纹理的尺寸y方向
     * @param n 纹理的张数
     * @param ltc 指定大图编号（-1：不指定）
     * @returns [大图编号，垂直位置，水平位置]
     */
    protected _findRoom(x: number, y: number, n: number, ltc: number = -1) {
        if (ltc >= 0) { //查找指定大图
            if (ltc < this.LARGE_TEX_N) {
                const room = this._peekRoomInMap(x, y, n, ltc, this._texMaps);
                return [ltc, room[0], room[1]];
            }
            return [-1, -1, -1];
        }
        for (let i = 0; i < this.LARGE_TEX_N; i += this.TEX_GROUP_MAX) {
            const room = this._peekRoomInMap(x, y, n, i, this._texMaps);
            if (room[0] >= 0)
                return [i, room[0], room[1]];
        }
        return [-1, -1, -1];
    }

    /**
     * 将纹理加入（可排序，面积大的排前面）
     * @param ti 纹理参数
     * @param sort 是否排序
     */
    protected _addToTextureItem(ti: TextureItem, sort: boolean = false) {
        const texItems = this._texItems[ti.ltc];
        if (sort) {
            const len = texItems.length;
            for (let i = 0; i < len; i++) {
                if (ti.w * ti.h > texItems[i].w * texItems[i].h) {
                    texItems.splice(i, 0, ti);
                    return;
                }
            }
        }
        texItems.push(ti);
    }
}

//大图合集类（通用）
export class LargeTexManager extends LargeTexBase {
    COLOR_ITEM_SIZE: number = 4; //颜色块尺寸，每个颜色块在纹理中的尺寸为 COLOR_ITEM_SIZE * COLOR_ITEM_SIZE
    static __LargeTexManagerAll: LargeTexManager[]; //统一管理多个大图合集对象

    private _curColor: Vector3[] = []; //当前合并的颜色序号（x：块横向起始，y：块纵向起始, z: 块内序号）
    private _curColorUV: Vector2 = new Vector2(); //当前合并的颜色UV值
    private _curColorMap: ColorItem[][] = []; //颜色图，已经合成到纹理中的颜色
    static texColorMap: Texture2D; //颜色索引纹理

    private _largeTexCode: number = 0; //当前大纹理编号
    private _reserve: boolean = false; //大图合集的空间是否保留1/4

    active: boolean = true; //当前大图合集对象是否激活

    /**
     * 分帧更新大图
     * @param force 强制更新
     */
    static __updateAll(force: boolean = false) {
        if (!force && Laya.stage.getTimeFromFrameStart() > 100) return;

        const ary = LargeTexManager.__LargeTexManagerAll;
        let n = ary.length;
        for (let i = 0; i < n; i++) {
            const o = ary[i];
            if (!o) continue;
            o.onUpdate();
            if (!force && Laya.stage.getTimeFromFrameStart() > 30) break;
        }
        if (ary.length != n)
            ary.length = n;
    }

    /**
     * 构造函数
     * @param lts 大纹理像素尺寸
     * @param ltn 大纹理数量上限
     * @param tsm 小纹理单元尺寸
     * @param exs 小纹理扩边尺寸
     * @param qds 大纹理观察尺寸
     */
    constructor(lts: number[], ltn: number, tsm: number = 16, exs: number = 0, qds: number = 10, texFormat?: RenderTargetFormat) {
        super(lts, ltn, tsm, exs, qds, texFormat);
        if (!LargeTexManager.__LargeTexManagerAll) {
            LargeTexManager.__LargeTexManagerAll = [];
            Laya.stage.timer.loop(200, LargeTexManager, LargeTexManager.__updateAll);
        }
        LargeTexManager.__LargeTexManagerAll.push(this);
        for (let i = 0; i < this.LARGE_TEX_N; i++) {
            this._curColor[i] = new Vector3(0, 0, -1);
            this._curColorMap[i] = []; //new Array<ColorItem>();
        }

        //创建共享颜色纹理（256x256 16bit色）
        if (!LargeTexManager.texColorMap) {
            LargeTexManager.texColorMap = new Texture2D(256, 256, TextureFormat.R8G8B8A8, this.mipMap, false, false);
            LargeTexManager.texColorMap.setPixelsData(null, false, false);
            LargeTexManager.texColorMap.filterMode = FilterMode.Point;
            LargeTexManager.texColorMap.anisoLevel = 1; //关闭各向异性
            LargeTexManager.texColorMap.lock = true;
            Functions.writeColorPatternToTexture16b(LargeTexManager.texColorMap);
        }
    }

    /**
     * 添加空白边框纹理
     * @param ltc 大纹理序号
     */
    addDummySideTexture(ltc: number = -1) {
        const tex = new Texture2D(1, 1, TextureFormat.R8G8B8A8, false, false);
        const data = new Uint8Array(4);
        data[0] = 0;
        data[1] = 0;
        data[2] = 0;
        data[3] = 0;
        tex.setPixelsData(data, false, false);
        this.addTexture([tex], 64, ltc, null, true);
    }

    /**
     * 添加颜色
     * @param color 颜色
     * @param ltc 大图纹理编号（-1:不指定）
     * @returns 成功大纹理编号，失败-1
     */
    addColor(color: Vector4, ltc: number = -1) {
        return this._addColor(color.x, color.y, color.z, color.w, ltc);
    }

    /**
     * 获取颜色所在的大纹理
     * @param color 颜色
     * @param uv 纹理坐标（不输入表示不获取）
     * @param ltc 大纹理编号（-1:不指定）
     * @returns 大纹理或null
     */
    getColor(color: Vector4, uv?: Vector4, ltc: number = -1) {
        let i = this._largeTexCode;
        if (ltc && ltc >= 0 && ltc < this.LARGE_TEX_N) i = ltc;
        const ci = this._findColor(color.x, color.y, color.z, color.w, i);
        if (ci) {
            if (uv) {
                uv.x = ci.u;
                uv.y = ci.v;
                uv.z = 1 / this.LARGE_TEX_W;
                uv.w = 1 / this.LARGE_TEX_H;
            }
            return this.largeTex[i];
        }
        return null;
    }

    /**
     * 获得大图合集是否有保留空间
     * @returns 
     */
    getReserve() {
        return this._reserve;
    }

    /**
     * 设置大图合集是否要保留空间
     * @param rv 是否保留
     */
    setReserve(rv: boolean) {
        this._reserve = rv;
    }

    /**
     * 销毁对象，清理内存
     * @param keepRes
     */
    destroy(keepRes: boolean = false) {
        for (let i = 0; i < LargeTexManager.__LargeTexManagerAll.length; i++) {
            if (LargeTexManager.__LargeTexManagerAll[i] == this) {
                LargeTexManager.__LargeTexManagerAll.splice(i, 1);
                break;
            }
        }
        super.destroy(keepRes);
        this.active = false;
    }

    /**
     * 查找颜色
     * @param r 颜色值
     * @param g 
     * @param b 
     * @param a 
     * @param ltc 大纹理编号
     * @returns 
     */
    private _findColor(r: number, g: number, b: number, a: number, ltc: number) {
        if (ltc >= 0 && ltc < this.LARGE_TEX_N) {
            const len = this._curColorMap[ltc].length;
            if (this.texFormat == RenderTargetFormat.R8G8B8) {
                for (let i = 0; i < len; i++) {
                    if (this._curColorMap[ltc][i]
                        && this._curColorMap[ltc][i].r == r
                        && this._curColorMap[ltc][i].g == g
                        && this._curColorMap[ltc][i].b == b) {
                        return this._curColorMap[ltc][i];
                    }
                }
            }
            else if (this.texFormat == RenderTargetFormat.R8G8B8A8) {
                for (let i = 0; i < len; i++) {
                    if (this._curColorMap[ltc][i]
                        && this._curColorMap[ltc][i].r == r
                        && this._curColorMap[ltc][i].g == g
                        && this._curColorMap[ltc][i].b == b
                        && this._curColorMap[ltc][i].a == a) {
                        return this._curColorMap[ltc][i];
                    }
                }
            }
        }
        return null;
    }

    /**
     * 清除所有纹理
     */
    removeAllTexture() {
        super.removeAllTexture();
        for (let i = 0; i < this.LARGE_TEX_N; i++) {
            this._curColor[i].setValue(0, 0, 0);
            this._curColorMap[i].length = 0;
        }
        this._largeTexCode = 0;
    }

    /**
     * 将颜色加入，颜色写入大纹理中
     * @param r 颜色值
     * @param g 
     * @param b 
     * @param a 
     * @param ltc 大纹理编号
     * @returns 
     */
    private _addColor(r: number, g: number, b: number, a: number, ltc: number) {
        let i = this._largeTexCode;
        if (ltc && ltc >= 0 && ltc < this.LARGE_TEX_N) i = ltc;
        let cti: ColorItem = this._findColor(r, g, b, a, i);
        if (cti) {
            this._curColorUV.x = cti.u;
            this._curColorUV.y = cti.v;
            return i; //这个颜色已经在当前大纹理中存在，复用即可
        }

        cti = {};
        let add = -1;
        const nc = (this.TEX_SIZE_MIN / this.COLOR_ITEM_SIZE) | 0;
        if (this._curColor[i].z >= 0 && this._curColor[i].z < nc * nc) add = i; //当前的颜色块还有空间
        else { //当前颜色块已经没有空间，重新找一个颜色块空间
            const room = this._findRoom(1, 1, 1);
            if (room[0] != -1) {
                const ti = new TextureItem();
                ti.id = 1; //颜色块的ID恒为1
                this._addToTextureItem(ti);

                const nw = this.LARGE_TEX_W / this.TEX_SIZE_MIN;
                const i1 = room[0];
                const j1 = room[1];
                const k1 = room[2];

                const index = j1 * nw + k1;
                this._texMaps[i1][index] = 1;
                this._curColor[i1].x = k1;
                this._curColor[i1].y = j1;
                this._curColor[i1].z = 0;
                this._largeTexCode = i1;
                add = this._largeTexCode;

                if (!this.largeTex[i1])
                    this.createLargeTex(i1);
            }
        }

        //将颜色写入纹理中
        if (add >= 0) {
            let x = this._curColor[add].z % nc;
            let y = (this._curColor[add].z / nc) | 0;
            x = this._curColor[add].x * this.TEX_SIZE_MIN + (x + 0.5) * this.COLOR_ITEM_SIZE;
            y = this._curColor[add].y * this.TEX_SIZE_MIN + (y + 0.5) * this.COLOR_ITEM_SIZE;
            this._curColorUV.x = x / this.LARGE_TEX_W;
            this._curColorUV.y = y / this.LARGE_TEX_H;
            cti.r = r;
            cti.g = g;
            cti.b = b;
            cti.a = a;
            cti.u = this._curColorUV.x;
            cti.v = this._curColorUV.y;
            cti.ltc = add;
            this._curColorMap[add].push(cti);
            this._curColor[add].z++;

            this.largeTex[add].addColor(x - this.COLOR_ITEM_SIZE * 0.5, y - this.COLOR_ITEM_SIZE * 0.5,
                this.COLOR_ITEM_SIZE, this.COLOR_ITEM_SIZE, new Vector4(r, g, b, a), this.texFormat);
            return add;
        }
        return -1;
    }

    /**
     * 查询纹理的空间（指定Map）
     * @param x 纹理的尺寸x方向
     * @param y 纹理的尺寸y方向
     * @param n 纹理的张数
     * @param ltc 大图序号
     * @param texMap 空间占用图
     * @returns 空间位置[垂值位置，水平位置]
     */
    protected _peekRoomInMap(x: number, y: number, n: number, ltc: number, texMap: number[][]) {
        const nw = this.LARGE_TEX_W / this.TEX_SIZE_MIN | 0;
        const nh = this.LARGE_TEX_H / this.TEX_SIZE_MIN | 0;
        const nw2 = (nw / 2) | 0;
        const nh2 = (nh / 2) | 0;
        for (let j = 0; j < nh - y + 1; j++) {
            for (let i = 0; i < nw - x + 1; i++) {
                let fail = false;
                for (let k = 0; k < n; k++)
                    if (texMap[ltc + k][j * nw + i] > 0)
                        fail = true;
                if (fail) continue;
                for (let m = j; m < j + y && !fail; m++) {
                    for (let l = i; l < i + x && !fail; l++) {
                        if (this._reserve) { //空间有保留
                            if (m > nh2 && l > nw2) {
                                fail = true;
                                continue;
                            }
                        }
                        for (let k = 0; k < n; k++)
                            if (texMap[ltc + k][m * nw + l] > 0)
                                fail = true;
                    }
                }
                if (!fail) return [j, i];
            }
        }
        return [-1, -1];
    }

    /**
     * 将大图保存到磁盘（便于检查大图合集中的内容）
     */
    saveLargeTexToDisk() {
        for (let i = 0; i < this.largeTex.length; i++) {
            const name = "largeTex_" + i + ".png";
            Functions.saveDataToFile(Functions.rt2Data(this.largeTex[i]), name);
        }
    }
}
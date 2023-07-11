import { Command } from "laya/d3/core/render/command/Command";
import { CommandBuffer } from "laya/d3/core/render/command/CommandBuffer";
import { Vector4 } from "laya/maths/Vector4";
import { RenderTexture } from "laya/resource/RenderTexture";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { FilterMode } from "laya/RenderEngine/RenderEnum/FilterMode";
import { TextureFormat } from "laya/RenderEngine/RenderEnum/TextureFormat";
import { Texture2D } from "laya/resource/Texture2D";
import { RenderTargetFormat } from "laya/RenderEngine/RenderEnum/RenderTargetFormat";
import { Texture } from "laya/resource/Texture";
import { ShaderData } from "laya/RenderEngine/RenderShader/ShaderData";
import { LayaGL } from "laya/layagl/LayaGL";
import { ShaderDefine } from "laya/RenderEngine/RenderShader/ShaderDefine";
import { Laya } from "Laya";

type SmallTexTask = {
    x: number, //位置
    y: number, //位置
    w: number, //宽度
    h: number, //高度
    expand: number, //边缘扩展量
    smallTex: Texture2D, //小贴图
    needRemove: boolean, //合图后小贴图需要删除
    version: number, //材质系统版本
}

export class LargeTex extends RenderTexture {
    cmdBuffer: CommandBuffer;
    private _limitMipmap: number = -1; //是否限制mipmap层数
    private _willDestroyTex = []; //待删除小贴图队列
    private _smallTexTask: SmallTexTask[] = [];
    private _shader: Shader3D; //合图的着色器
    private _sdNotChange: ShaderData; //着色器数据（颜色空间不变）
    private _sdGammaToLinear: ShaderData; //着色器数据（伽马转线性）
    private _sdLinearToGamma: ShaderData; //着色器数据（线性转伽马）
    private static LINEAR_TO_GAMMA: ShaderDefine;
    private static GAMMA_TO_LINEAR: ShaderDefine;
    immediately: boolean = false; //是否立即执行合并
    static __init__() { }

    constructor(width: number, height: number, format: RenderTargetFormat = RenderTargetFormat.R8G8B8A8,
        depthStencilFormat: RenderTargetFormat = null, mipmap: boolean = false, limitMipmap: number = -1, sRGB: boolean = true) {
        super(width, height, format, depthStencilFormat, mipmap, 1, false, sRGB);
        this._limitMipmap = limitMipmap;
        this.anisoLevel = 1;
        if (this._limitMipmap >= 0) {
            if (this.mipmapCount > this._limitMipmap)
                this._setMaxMipmapLevel(this._limitMipmap);
        }
        this._shader = Shader3D.find("TexMerge");
        this._sdNotChange = LayaGL.renderOBJCreate.createShaderData(this);
        this._sdGammaToLinear = LayaGL.renderOBJCreate.createShaderData(this);
        this._sdLinearToGamma = LayaGL.renderOBJCreate.createShaderData(this);
        LargeTex.LINEAR_TO_GAMMA = Shader3D.getDefineByName("LINEAR_TO_GAMMA");
        LargeTex.GAMMA_TO_LINEAR = Shader3D.getDefineByName("GAMMA_TO_LINEAR");
        this._linearToGamma(true, this._sdLinearToGamma);
        this._gammaToLinear(true, this._sdGammaToLinear);
    }

    /**
     * 线性空间转伽马空间
     * @param enable 
     */
    private _linearToGamma(enable: boolean, sd: ShaderData) {
        if (enable)
            sd.addDefine(LargeTex.LINEAR_TO_GAMMA);
        else sd.removeDefine(LargeTex.LINEAR_TO_GAMMA);
    }

    /**
     * 伽马空间转线性空间
     * @param enable 
     */
    private _gammaToLinear(enable: boolean, sd: ShaderData) {
        if (enable)
            sd.addDefine(LargeTex.GAMMA_TO_LINEAR);
        else sd.removeDefine(LargeTex.GAMMA_TO_LINEAR);
    }

    /**
     * 分帧调用的Update函数
     */
    onUpdate(force: boolean = false) {
        if (this._smallTexTask.length > 0) {
            for (let i = this._smallTexTask.length - 1; i > -1; i--) {
                const stt = this._smallTexTask[i];
                //@ts-ignore
                if (stt.smallTex.real || stt.smallTex.real == undefined) {
                    this.addTexture(stt.x, stt.y, stt.w, stt.h, stt.expand, stt.smallTex, stt.needRemove, stt.version);
                    this._smallTexTask.splice(i, 1);
                    if (Laya.stage.getTimeFromFrameStart() > 30) break;
                }
            }
        }

        if (!this.cmdBuffer || !this.cmdBuffer.getCommandsSize()) return;

        //@ts-ignore
        const shaderDate = Command._screenShaderData;
        const _ScreenRotate = Shader3D.getDefineByName("SCREENROTATE");
        const oriScreenRotate = shaderDate.hasDefine(_ScreenRotate);
        shaderDate.removeDefine(_ScreenRotate);

        while (this.cmdBuffer._applyOne() && (force || Laya.stage.getTimeFromFrameStart() < 30));
        if (oriScreenRotate) //屏幕有旋转（横竖屏变化）
            shaderDate.addDefine(_ScreenRotate);
        this.cmdBuffer.getCommandsSize() || this._doDestoryTex();
    }

    /**
     * 设置Mipmap最大层次
     * @param count 
     */
    private _setMaxMipmapLevel(count: number) {
        this.baseMipmapLevel = 0;
        this.maxMipmapLevel = count;
    }

    /**
     * 绘制小贴图到大贴图上，带扩边功能
     * @param x 绘制到大贴图的位置x
     * @param y 绘制到大贴图的位置y
     * @param w 绘制到大贴图的宽度
     * @param h 绘制到大贴图的高度
     * @param expand 扩边像素数
     * @param smallTex 小贴图
     * @param version 材质系统版本
     */
    addTexture(x: number, y: number, w: number, h: number, expand: number, smallTex: Texture2D, needRemove: boolean, version: number = 3) {
        //@ts-ignore
        if (smallTex.real != undefined && smallTex.real == false) {
            this._smallTexTask.push({ x, y, w, h, expand, smallTex, needRemove, version });
            return;
        }
        if (expand > 0)
            this._drawTex(x, y, w, h, expand, smallTex, version);
        this._drawTex(x, y, w, h, 0, smallTex, version);
        if (needRemove)
            this._willDestroyTex.push(smallTex);
    }

    /**
     * 向大贴图指定的位置和尺寸填充颜色
     * @param x 填充的位置x
     * @param y 填充的位置y
     * @param w 填充的宽度
     * @param h 填充的高度 
     * @param color 填充的颜色
     * @param format 贴图格式
     */
    addColor(x: number, y: number, w: number, h: number, color: Vector4, format: number) {
        let cf: Uint8Array;
        let smallTex: Texture2D;
        if (format == TextureFormat.R8G8B8) {
            const r = color.x * 255;
            const g = color.y * 255;
            const b = color.z * 255;
            cf = new Uint8Array(w * h * 3);
            for (let i = 0; i < h; i++) {
                for (let j = 0; j < w; j++) {
                    let index = i * w * 3 + j * 3;
                    cf[index] = r;
                    cf[index + 1] = g;
                    cf[index + 2] = b;
                }
            }
        }
        else if (format == TextureFormat.R8G8B8A8) {
            const r = color.x * 255;
            const g = color.y * 255;
            const b = color.z * 255;
            const a = color.w * 255;
            cf = new Uint8Array(w * h * 4);
            for (let i = 0; i < h; i++) {
                for (let j = 0; j < w; j++) {
                    let index = i * w * 4 + j * 4;
                    cf[index] = r;
                    cf[index + 1] = g;
                    cf[index + 2] = b;
                    cf[index + 3] = a;
                }
            }
        }
        smallTex = this._createSmallTex(w, h, cf);
        this._drawTex(x, y, w, h, 0, smallTex);
        this._willDestroyTex.push(smallTex);
    }

    /**
     * 向大贴图填充颜色
     * @param color 填充的颜色
     * @param format 贴图格式
     */
    fillColor(color: Vector4, format: number) {
        const x = 0, y = 0, w = 4, h = 4;
        let cf: Uint8Array;
        let smallTex: Texture2D;
        if (format == TextureFormat.R8G8B8) {
            const r = color.x * 255;
            const g = color.y * 255;
            const b = color.z * 255;
            cf = new Uint8Array(w * h * 3);
            for (let i = 0; i < h; i++) {
                for (let j = 0; j < w; j++) {
                    let index = i * w * 3 + j * 3;
                    cf[index] = r;
                    cf[index + 1] = g;
                    cf[index + 2] = b;
                }
            }
        }
        else if (format == TextureFormat.R8G8B8A8) {
            const r = color.x * 255;
            const g = color.y * 255;
            const b = color.z * 255;
            const a = color.w * 255;
            cf = new Uint8Array(w * h * 4);
            for (let i = 0; i < h; i++) {
                for (let j = 0; j < w; j++) {
                    const index = i * w * 4 + j * 4;
                    cf[index] = r;
                    cf[index + 1] = g;
                    cf[index + 2] = b;
                    cf[index + 3] = a;
                }
            }
        }
        smallTex = this._createSmallTex(w, h, cf);
        this._drawTex(x, y, this.width, this.height, 0, smallTex);
        this._willDestroyTex.push(smallTex);
    }

    /**
     * 销毁对象，清理内存
     */
    destroy() {
        super.destroy(); //@ts-ignore
        this.cmdBuffer && this.cmdBuffer.clear();
        this.cmdBuffer = null;
        this._doDestoryTex();
        this._willDestroyTex = null;
    }

    /**
     * 创建小贴图
     * @param w 宽度
     * @param h 高度
     * @param pixelArray 像素数据 
     * @returns 贴图对象
     */
    private _createSmallTex(w: number, h: number, pixelArray: Uint8Array): Texture2D {
        const smallTex = new Texture2D(w, h, this.format, false, false, false);
        smallTex.setPixelsData(pixelArray, false, false);
        smallTex.filterMode = FilterMode.Point;
        return smallTex;
    }

    /**
     * 删除小贴图
     */
    private _doDestoryTex() {
        if (this._willDestroyTex)
            while (this._willDestroyTex.length)
                this._willDestroyTex.pop().destroy();
    }

    /**
     * 绘制小贴图到大贴图上，包含扩边功能
     * @param x 绘制到大贴图的位置x
     * @param y 绘制到大贴图的位置y
     * @param w 绘制到大贴图的宽度
     * @param h 绘制到大贴图的高度
     * @param expand 扩边像素数
     * @param smallTex 小贴图
     * @param version 材质系统版本
     */
    private _drawTex(x: number, y: number, w: number, h: number, expand: number, smallTex: Texture2D, version: number = 3) {
        const width = this.width; //大贴图宽度
        const height = this.height; //大贴图高度
        const offsetScale = new Vector4(); //偏移和放缩系数
        offsetScale.x = Math.max(0, x - expand) / width;
        offsetScale.y = Math.max(0, height - y - h - expand) / height;
        offsetScale.z = (w + expand * 2) / width;
        offsetScale.w = (h + expand * 2) / height;
        if (smallTex instanceof Texture)
            smallTex = smallTex.bitmap as any;
        let sd = this._sdNotChange;
        if (version < 4) { //4.0版及以上不用转换
            if (this.gammaSpace && !smallTex.gammaSpace) {
                sd = this._sdGammaToLinear;
                console.log("gamma to linear url =", smallTex.url);
            }
            else if (!this.gammaSpace && smallTex.gammaSpace) {
                sd = this._sdLinearToGamma;
                console.log("linear to gamma url =", smallTex.url);
            }
        }
        //采用实时渲染方式将小贴图绘制到大贴图上
        this.cmdBuffer.blitScreenQuad(smallTex, this, offsetScale, this._shader, sd);
        if (this.immediately) //立即执行绘制
            this.onUpdate(true);
    }
}
import { Material } from "laya/d3/core/material/Material";
import { RenderState } from "laya/RenderEngine/RenderShader/RenderState";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { ShaderDefine } from "laya/RenderEngine/RenderShader/ShaderDefine";
import { BaseTexture } from "laya/resource/BaseTexture";
import { Color } from "laya/maths/Color";

export class ImposterMaterial extends Material {
    static SHADERDEFINE_ALBEDO_MAP: ShaderDefine;

    static SHININESS: number;
    static MATERIAL_SPECULAR: number;

    static ALBEDO_COLOR: number;
    static ALBEDO_TEXTURE: number;

    static SCALE: number;

    private static _init = false;

    static _initStatic_() {
        const _this = ImposterMaterial;
        const propertyNameToID = Shader3D.propertyNameToID;

        _this.SHADERDEFINE_ALBEDO_MAP = Shader3D.getDefineByName("ALBEDO_MAP");

        _this.ALBEDO_COLOR = propertyNameToID("u_AlbedoColor");
        _this.ALBEDO_TEXTURE = propertyNameToID("u_AlbedoTexture");

        _this.SHININESS = propertyNameToID("u_Shininess");
        _this.MATERIAL_SPECULAR = propertyNameToID("u_MaterialSpecular");

        _this.SCALE = propertyNameToID("u_Scale");
    }

    static __init__() {
        if (ImposterMaterial._init) return;
        ImposterMaterial._init = true;
        this._initStatic_();
    }

    /**
     * 放缩系数
     */
    get scale(): number {
        return this.getFloatByIndex(ImposterMaterial.SCALE);
    }
    set scale(value: number) {
        this.setFloatByIndex(ImposterMaterial.SCALE, value);
    }

    /**
     * 高光强度，范围为0到1
     */
    get shininess(): number {
        return this.getFloatByIndex(ImposterMaterial.SHININESS);
    }
    set shininess(value: number) {
        value = Math.max(0, Math.min(1, value));
        this.setFloatByIndex(ImposterMaterial.SHININESS, value);
    }

    /**
     * 高光颜色
     */
    get specularColor(): Color {
        return this.getColorByIndex(ImposterMaterial.MATERIAL_SPECULAR);
    }
    set specularColor(value: Color) {
        this.setColorByIndex(ImposterMaterial.MATERIAL_SPECULAR, value);
    }

    /**
     * 基本颜色
     */
    get albedoColor(): Color {
        return this.getColorByIndex(ImposterMaterial.ALBEDO_COLOR);
    }
    set albedoColor(value: Color) {
        this.setColorByIndex(ImposterMaterial.ALBEDO_COLOR, value);
    }

    /**
     * 颜色贴图
     */
    get albedoTexture(): BaseTexture {
        return this._shaderValues.getTexture(ImposterMaterial.ALBEDO_TEXTURE);
    }
    set albedoTexture(value: BaseTexture) {
        if (value)
            this._shaderValues.addDefine(ImposterMaterial.SHADERDEFINE_ALBEDO_MAP);
        else this._shaderValues.removeDefine(ImposterMaterial.SHADERDEFINE_ALBEDO_MAP);
        this._shaderValues.setTexture(ImposterMaterial.ALBEDO_TEXTURE, value);
    }

    constructor() {
        super();
        this.setShaderName("TreeImposterShader");
        this.renderModeSet();
    }

    //设置渲染模式
    renderModeSet() {
        this.renderQueue = Material.RENDERQUEUE_OPAQUE;
        this.alphaTest = true;
        this.depthWrite = true;
        this.cull = RenderState.CULL_NONE;
        this.blend = RenderState.BLEND_DISABLE;
        this.depthTest = RenderState.DEPTHTEST_LESS;
    }
}
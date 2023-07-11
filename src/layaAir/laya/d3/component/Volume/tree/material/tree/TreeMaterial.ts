import { Material } from "laya/d3/core/material/Material";
import { RenderState } from "laya/RenderEngine/RenderShader/RenderState";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { ShaderDefine } from "laya/RenderEngine/RenderShader/ShaderDefine";
import { BaseTexture } from "laya/resource/BaseTexture";
import { Color } from "laya/maths/Color";
import { Vector4 } from "laya/maths/Vector4";

export class TreeMaterial extends Material {
    static SHADERDEFINE_PARAM_MAP: ShaderDefine;
    static SHADERDEFINE_ALBEDO_MAP: ShaderDefine;

    static SHADERDEFINE_LOD: ShaderDefine; //细节层次
    static SHADERDEFINE_WIND: ShaderDefine; //随风摇动

    static SHININESS: number;
    static MATERIAL_SPECULAR: number;

    static PARAM_TEXTURE: number;
    static ALBEDO_TEXTURE: number;

    static SEASON: number;
    static PARAM_WIND: number; //x: intensity y: frequency z: direction
    static PARAM_SIZE: number;
    static PARAM_STRIDE: number;
    static TREE_HEIGHT: number;

    private static _init = false;

    static _initStatic_() {
        const _this = TreeMaterial;
        const propertyNameToID = Shader3D.propertyNameToID;

        _this.SHADERDEFINE_PARAM_MAP = Shader3D.getDefineByName("PARAM_MAP");
        _this.SHADERDEFINE_ALBEDO_MAP = Shader3D.getDefineByName("ALBEDO_MAP");

        _this.SHADERDEFINE_LOD = Shader3D.getDefineByName("LOD");
        _this.SHADERDEFINE_WIND = Shader3D.getDefineByName("WIND");

        _this.PARAM_TEXTURE = propertyNameToID("u_ParamTexture");
        _this.ALBEDO_TEXTURE = propertyNameToID("u_AlbedoTexture");

        _this.SEASON = propertyNameToID("u_Season");
        _this.PARAM_WIND = propertyNameToID("u_ParamWind");
        _this.PARAM_SIZE = propertyNameToID("u_ParamSize");
        _this.PARAM_STRIDE = propertyNameToID("u_ParamStride");
        _this.TREE_HEIGHT = propertyNameToID("u_TreeHeight");

        _this.SHININESS = propertyNameToID("u_Shininess");
        _this.MATERIAL_SPECULAR = propertyNameToID("u_MaterialSpecular");
    }

    static __init__() {
        if (TreeMaterial._init) return;
        TreeMaterial._init = true;
        this._initStatic_();
    }

    /**
     * 高光强度，范围为0到1
     */
    get shininess(): number {
        return this.getFloatByIndex(TreeMaterial.SHININESS);
    }
    set shininess(value: number) {
        value = Math.max(0, Math.min(1, value));
        this.setFloatByIndex(TreeMaterial.SHININESS, value);
    }

    /**
     * 高光颜色
     */
    get specularColor(): Color {
        return this.getColorByIndex(TreeMaterial.MATERIAL_SPECULAR);
    }
    set specularColor(value: Color) {
        this.setColorByIndex(TreeMaterial.MATERIAL_SPECULAR, value);
    }

    /**
     * 参数贴图
     */
    get paramTexture(): BaseTexture {
        return this._shaderValues.getTexture(TreeMaterial.PARAM_TEXTURE);
    }
    set paramTexture(value: BaseTexture) {
        if (value)
            this._shaderValues.addDefine(TreeMaterial.SHADERDEFINE_PARAM_MAP);
        else this._shaderValues.removeDefine(TreeMaterial.SHADERDEFINE_PARAM_MAP);
        this._shaderValues.setTexture(TreeMaterial.PARAM_TEXTURE, value);
    }

    /**
     * 颜色贴图
     */
    get albedoTexture(): BaseTexture {
        return this._shaderValues.getTexture(TreeMaterial.ALBEDO_TEXTURE);
    }
    set albedoTexture(value: BaseTexture) {
        if (value)
            this._shaderValues.addDefine(TreeMaterial.SHADERDEFINE_ALBEDO_MAP);
        else this._shaderValues.removeDefine(TreeMaterial.SHADERDEFINE_ALBEDO_MAP);
        this._shaderValues.setTexture(TreeMaterial.ALBEDO_TEXTURE, value);
    }

    get season(): number {
        return this.getFloatByIndex(TreeMaterial.SEASON);
    }
    set season(value: number) {
        this.setFloatByIndex(TreeMaterial.SEASON, value);
    }

    get paramSize(): number {
        return this.getFloatByIndex(TreeMaterial.PARAM_SIZE);
    }
    set paramSize(value: number) {
        this.setFloatByIndex(TreeMaterial.PARAM_SIZE, value);
    }

    get paramStride(): number {
        return this.getFloatByIndex(TreeMaterial.PARAM_STRIDE);
    }
    set paramStride(value: number) {
        this.setFloatByIndex(TreeMaterial.PARAM_STRIDE, value);
    }

    get treeHeight(): number {
        return this.getFloatByIndex(TreeMaterial.TREE_HEIGHT);
    }
    set treeHeight(value: number) {
        this.setFloatByIndex(TreeMaterial.TREE_HEIGHT, value);
    }

    get lod(): boolean {
        return this._shaderValues.hasDefine(TreeMaterial.SHADERDEFINE_LOD);
    }
    set lod(value: boolean) {
        if (value)
            this._shaderValues.addDefine(TreeMaterial.SHADERDEFINE_LOD);
        else this._shaderValues.removeDefine(TreeMaterial.SHADERDEFINE_LOD);
    }

    get wind(): boolean {
        return this._shaderValues.hasDefine(TreeMaterial.SHADERDEFINE_WIND);
    }
    set wind(value: boolean) {
        if (value)
            this._shaderValues.addDefine(TreeMaterial.SHADERDEFINE_WIND);
        else this._shaderValues.removeDefine(TreeMaterial.SHADERDEFINE_WIND);
    }

    constructor() {
        super();
        this.setShaderName("TreeShader");
        this.renderModeSet();
    }

    //设置风参数
    setWind(wind: Vector4) {
        this._shaderValues.setVector(TreeMaterial.PARAM_WIND, wind);
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
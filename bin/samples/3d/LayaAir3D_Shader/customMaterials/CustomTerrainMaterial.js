import { BaseMaterial } from "laya/d3/core/material/BaseMaterial";
import { Shader3D } from "laya/d3/shader/Shader3D";
import { ShaderDefines } from "laya/d3/shader/ShaderDefines";
/**
 * ...
 * @author
 */
export class CustomTerrainMaterial extends BaseMaterial {
    constructor() {
        super();
        this.setShaderName("CustomTerrainShader");
    }
    /**
     * @private
     */
    static __init__() {
        CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM1 = CustomTerrainMaterial.shaderDefines.registerDefine("CUSTOM_DETAIL_NUM1");
        CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM2 = CustomTerrainMaterial.shaderDefines.registerDefine("CUSTOM_DETAIL_NUM2");
        CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM3 = CustomTerrainMaterial.shaderDefines.registerDefine("CUSTOM_DETAIL_NUM3");
        CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM4 = CustomTerrainMaterial.shaderDefines.registerDefine("CUSTOM_DETAIL_NUM4");
        CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM5 = CustomTerrainMaterial.shaderDefines.registerDefine("CUSTOM_DETAIL_NUM5");
    }
    /**
     * 获取splatAlpha贴图。
     * @return splatAlpha贴图。
     */
    get splatAlphaTexture() {
        return this._shaderValues.getTexture(CustomTerrainMaterial.SPLATALPHATEXTURE);
    }
    /**
     * 设置splatAlpha贴图。
     * @param value splatAlpha贴图。
     */
    set splatAlphaTexture(value) {
        this._shaderValues.setTexture(CustomTerrainMaterial.SPLATALPHATEXTURE, value);
    }
    /**
     * 获取第一层贴图。
     * @return 第一层贴图。
     */
    get diffuseTexture1() {
        return this._shaderValues.getTexture(CustomTerrainMaterial.DIFFUSETEXTURE1);
    }
    /**
     * 设置第一层贴图。
     * @param value 第一层贴图。
     */
    set diffuseTexture1(value) {
        this._shaderValues.setTexture(CustomTerrainMaterial.DIFFUSETEXTURE1, value);
        this._setDetailNum(1);
    }
    /**
     * 获取第二层贴图。
     * @return 第二层贴图。
     */
    get diffuseTexture2() {
        return this._shaderValues.getTexture(CustomTerrainMaterial.DIFFUSETEXTURE2);
    }
    /**
     * 设置第二层贴图。
     * @param value 第二层贴图。
     */
    set diffuseTexture2(value) {
        this._shaderValues.setTexture(CustomTerrainMaterial.DIFFUSETEXTURE2, value);
        this._setDetailNum(2);
    }
    /**
     * 获取第三层贴图。
     * @return 第三层贴图。
     */
    get diffuseTexture3() {
        return this._shaderValues.getTexture(CustomTerrainMaterial.DIFFUSETEXTURE3);
    }
    /**
     * 设置第三层贴图。
     * @param value 第三层贴图。
     */
    set diffuseTexture3(value) {
        this._shaderValues.setTexture(CustomTerrainMaterial.DIFFUSETEXTURE3, value);
        this._setDetailNum(3);
    }
    /**
     * 获取第四层贴图。
     * @return 第四层贴图。
     */
    get diffuseTexture4() {
        return this._shaderValues.getTexture(CustomTerrainMaterial.DIFFUSETEXTURE4);
    }
    /**
     * 设置第四层贴图。
     * @param value 第四层贴图。
     */
    set diffuseTexture4(value) {
        this._shaderValues.setTexture(CustomTerrainMaterial.DIFFUSETEXTURE4, value);
        this._setDetailNum(4);
    }
    /**
     * 获取第五层贴图。
     * @return 第五层贴图。
     */
    get diffuseTexture5() {
        return this._shaderValues.getTexture(CustomTerrainMaterial.DIFFUSETEXTURE5);
    }
    /**
     * 设置第五层贴图。
     * @param value 第五层贴图。
     */
    set diffuseTexture5(value) {
        this._shaderValues.setTexture(CustomTerrainMaterial.DIFFUSETEXTURE5, value);
        this._setDetailNum(5);
    }
    setDiffuseScale1(scale1) {
        this._shaderValues.setVector2(CustomTerrainMaterial.DIFFUSESCALE1, scale1);
    }
    setDiffuseScale2(scale2) {
        this._shaderValues.setVector2(CustomTerrainMaterial.DIFFUSESCALE2, scale2);
    }
    setDiffuseScale3(scale3) {
        this._shaderValues.setVector2(CustomTerrainMaterial.DIFFUSESCALE3, scale3);
    }
    setDiffuseScale4(scale4) {
        this._shaderValues.setVector2(CustomTerrainMaterial.DIFFUSESCALE4, scale4);
    }
    setDiffuseScale5(scale5) {
        this._shaderValues.setVector2(CustomTerrainMaterial.DIFFUSESCALE5, scale5);
    }
    _setDetailNum(value) {
        switch (value) {
            case 1:
                this._shaderValues.addDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM1);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM2);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM3);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM4);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM5);
                break;
            case 2:
                this._shaderValues.addDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM2);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM1);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM3);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM4);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM5);
                break;
            case 3:
                this._shaderValues.addDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM3);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM1);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM2);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM4);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM5);
                break;
            case 4:
                this._shaderValues.addDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM4);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM1);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM2);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM3);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM5);
                break;
            case 5:
                this._shaderValues.addDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM5);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM1);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM2);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM3);
                this._shaderValues.removeDefine(CustomTerrainMaterial.SHADERDEFINE_DETAIL_NUM4);
                break;
        }
    }
}
CustomTerrainMaterial.SPLATALPHATEXTURE = Shader3D.propertyNameToID("u_SplatAlphaTexture");
CustomTerrainMaterial.DIFFUSETEXTURE1 = Shader3D.propertyNameToID("u_DiffuseTexture1");
CustomTerrainMaterial.DIFFUSETEXTURE2 = Shader3D.propertyNameToID("u_DiffuseTexture2");
CustomTerrainMaterial.DIFFUSETEXTURE3 = Shader3D.propertyNameToID("u_DiffuseTexture3");
CustomTerrainMaterial.DIFFUSETEXTURE4 = Shader3D.propertyNameToID("u_DiffuseTexture4");
CustomTerrainMaterial.DIFFUSETEXTURE5 = Shader3D.propertyNameToID("u_DiffuseTexture5");
CustomTerrainMaterial.DIFFUSESCALE1 = Shader3D.propertyNameToID("u_DiffuseScale1");
CustomTerrainMaterial.DIFFUSESCALE2 = Shader3D.propertyNameToID("u_DiffuseScale2");
CustomTerrainMaterial.DIFFUSESCALE3 = Shader3D.propertyNameToID("u_DiffuseScale3");
CustomTerrainMaterial.DIFFUSESCALE4 = Shader3D.propertyNameToID("u_DiffuseScale4");
CustomTerrainMaterial.DIFFUSESCALE5 = Shader3D.propertyNameToID("u_DiffuseScale5");
/**@private */
CustomTerrainMaterial.shaderDefines = new ShaderDefines(BaseMaterial.shaderDefines);

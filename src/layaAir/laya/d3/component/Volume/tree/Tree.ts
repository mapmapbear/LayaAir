import { Mesh } from "laya/d3/resource/models/Mesh";
import { Material } from "laya/d3/core/material/Material";
import { MeshSprite3D } from "laya/d3/core/MeshSprite3D";
import { Texture2D } from "laya/resource/Texture2D";
import { TreeRender } from "./TreeRender";
import { TreeResource } from "./TreeResource";
import { Matrix4x4 } from "laya/maths/Matrix4x4";
import { Ray } from "laya/d3/math/Ray";
import { TreeMaterial } from "./material/tree/TreeMaterial";
import { Functions } from "../utils/Functions";
import { TreeUtils } from "./TreeUtils";
import { CommandBuffer } from "laya/d3/core/render/command/CommandBuffer";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { Shader } from "laya/webgl/shader/Shader";
import { Vector4 } from "laya/maths/Vector4";
import { MeshFilter } from "laya/d3/core/MeshFilter";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { MeshRenderer } from "laya/d3/core/MeshRenderer";

/**
 * 树木精灵
 */
export class TreeMeshSprite3D extends MeshSprite3D {
    pickMesh: Mesh;
    constructor(mesh: Mesh, material: Material) {
        super(mesh);
        this.meshRenderer.material = material;
    }

    /**
     * 设置材质
     * @param mat 
     */
    setMaterial(mat: Material) {
        this.meshRenderer.material = mat;
    }

    /**
     * 设置贴图
     * @param tex 
     */
    setTexture(tex: Texture2D) {
        (<TreeMaterial>this.meshRenderer.material).albedoTexture = tex;
    }

    /**
     * 是否和射线有交点
     * @param ray 
     * @param transform 
     */
    rayPick(ray: Ray, transform: Matrix4x4) {
        const p = Functions.rayIntersectMesh(ray, this.pickMesh, transform);
        return p < 1000; //距离小于1000
    }
}

/**
 * 树木
 */
export class Tree {
    id: number; //树木实例编号
    lod: number = 0; //当前Lod等级
    code: number = 0; //树木形状编号
    grow: number = 0; //生长系数（0~1）
    dist: number = 0; //距离系数（0~1）
    drop: number = 0; //重力系数（-2~2）
    hidePot: number = 0; //是否隐藏花盆（0: 不隐藏，1: 隐藏）
    luminance: number = 1; //亮度系数
    saturation: number = 1; //色度系数
    hue: number = 0; //色相系数
    flash: number = 0; //闪烁系数
    tr: TreeResource; //树木资源
    private _destroyed: boolean = false; //是否已经销毁
    private _render: TreeRender; //树木渲染器
    _t3ds: TreeMeshSprite3D[] = []; //各Lod等级树木精灵
    
    count = 0;

    renderNode : any;

    constructor(id: number, code: number, grow: number, hidePot: number, tr: TreeResource, render: TreeRender) {
        this.id = id;
        this.tr = tr;
        this.code = code;
        this.grow = grow;
        this.hidePot = hidePot;
        this._render = render;
        this.count = 0;
    }

    /**
     * 设置Lod等级
     * @param lod 
     */
    setLod(lod: number) {
        this.lod = lod;
    }

    /**
     * 生成树木
     */
    createTree() {
        if (this._destroyed) return;
        const len = this.tr.cfg.param.lodNum - 1;
        for (let i = 0; i < len; i++) {
            this._t3ds[i] = new TreeMeshSprite3D(this.tr.mesh[i], this.tr.material);
            this._t3ds[i].pickMesh = this.tr.pickMesh;
        }
        this._t3ds[len] = new TreeMeshSprite3D(this.tr.mesh[len], this.tr.matImposter);
        this._t3ds[len].pickMesh = this.tr.pickMesh;
    }

    /**
     * 设置材质
     * @param mat 
     */
    setMaterial(mat: Material) {
        if (this._destroyed) return;
        for (let i = 0, len = this.tr.cfg.param.lodNum; i < len; i++)
            this._t3ds[i].setMaterial(mat);
    }

    /**
     * 设置纹理
     * @param tex 
     */
    setTexture(tex: Texture2D) {
        if (this._destroyed) return;
        for (let i = 0, len = this.tr.cfg.param.lodNum; i < len; i++)
            this._t3ds[i].setTexture(tex);
    }

    /**
     * 设置世界矩阵（直接引用外面的）
     * @param mat 
     */
    setWorldMatrix(mat: Matrix4x4) {
        if (this._destroyed) return;
        for (let i = 0, len = this.tr.cfg.param.lodNum; i < len; i++)
            TreeUtils.setWorldMatrixObject(this._t3ds[i].transform, mat);
    }

    /**
     * 提交instance渲染数据
     */
    renderCamera() {
        if (this._destroyed) return;
        const lod = this.lod;
        const texture = lod == this.tr.cfg.param.lodNum - 1 ? this.tr.texImposter : this.tr.texture;
        const instDataCamera = {
            id: this.id,
            mesh: this._t3ds[lod].meshFilter.sharedMesh,
            material: this._t3ds[lod].meshRenderer.sharedMaterial,
            matrix: this._t3ds[lod].transform.worldMatrix,
            texture: texture,
            kind: this.code,
            grow: this.grow,
            dist: this.dist, 
            drop: this.drop,
            hidePot: this.hidePot,
            luminance: this.luminance,
            saturation: this.saturation,
            hue: this.hue,
            flash: this.flash,
        }
        // instDataCamera.material.setVector4("u_InstanceParam1", new Vector4(this.code, this.grow, this.dist, this.drop));
        // instDataCamera.material.setVector4("u_InstanceParam2", new Vector4(this.hidePot, this.luminance, this.saturation, this.hue));
        // instDataCamera.material.setVector4("u_InstanceParam3", new Vector4(this.flash, 0.0, 0.0, 0.0));
        // // console.log(this.id);
        // var node = new Sprite3D("name" + this.id);
        // node.addComponent(MeshRenderer).sharedMaterial = instDataCamera.material;
        // node.addComponent(MeshFilter).sharedMesh = instDataCamera.mesh;
        // // console.log("mesh: ", node.getComponent(MeshRenderer));
        // node.getComponent(MeshRenderer)._onMeshChange(instDataCamera.mesh);
        
        this.renderNode = {
            id: this.id,
            mesh: this._t3ds[0].meshFilter.sharedMesh,
            material: this._t3ds[0].meshRenderer.sharedMaterial,
            matrix: this._t3ds[0].transform.worldMatrix,
            texture: texture,
            kind: this.code,
            grow: this.grow,
            dist: this.dist, 
            drop: this.drop,
            hidePot: this.hidePot,
            luminance: this.luminance,
            saturation: this.saturation,
            hue: this.hue,
            flash: this.flash,
        };
        this.renderNode.material.setVector4("u_InstanceParam1", new Vector4(this.code, this.grow, this.dist, this.drop));
        this.renderNode.material.setVector4("u_InstanceParam2", new Vector4(this.hidePot, this.luminance, this.saturation, this.hue));
        this.renderNode.material.setVector4("u_InstanceParam3", new Vector4(this.flash, 0.0, 0.0, 0.0));
        
        // this._render.addRenderDataCamera(instDataCamera);
    }

    /**
     * 提交instance渲染数据
     */
    renderShadow() {
        if (this._destroyed) return;
        const last = this.tr.cfg.param.lodNum - 1;
        if (this.lod < last) {
            const lod = this.lod;
            const texture = this.tr.texture;
            const instDataShadow = {
                id: this.id,
                mesh: this._t3ds[lod].meshFilter.sharedMesh,
                material: this._t3ds[lod].meshRenderer.sharedMaterial,
                matrix: this._t3ds[lod].transform.worldMatrix,
                texture: texture,
                kind: this.code,
                grow: this.grow,
                dist: this.dist,
                drop: this.drop,

                hidePot: this.hidePot,
                luminance: this.luminance,
                saturation: this.saturation,
                hue: this.hue,

                flash: this.flash,
            }
            // var iid1 : number = Shader3D.propertyNameToID("u_InstanceParam1");
            // var iid2 = Shader3D.propertyNameToID("u_InstanceParam2");
            // var iid3 = Shader3D.propertyNameToID("u_InstanceParam3");
            
            
        }
    }

    /**
     * 添加到可视树木队列（相机）
     */
    addVisibleTreeCamera() {
        if (!this._destroyed)
            this._render.addVisibleTreeCamera(this);
    }

    /**
     * 添加到可视树木队列（阴影）
     */
    addVisibleTreeShadow() {
        if (!this._destroyed)
            this._render.addVisibleTreeShadow(this);
    }

    /**
     * 是否和射线有交点
     * @param ray 
     * @param transform 
     */
    rayPick(ray: Ray, transform: Matrix4x4) {
        if (this._destroyed) return false;
        return this._t3ds[0].rayPick(ray, transform);
    }

    /**
     * 是否具有拾取网格
     * @returns 
     */
    havePickMesh() {
        if (this._destroyed) return false;
        return this._t3ds[0].pickMesh != undefined;
    }

    /**
     * 设置放缩比例
     * @param s 
     */
    setScale(s: number) {
        this.tr.setScale(s);
    }

    /**
     * 销毁
     */
    destroy() {
        if (!this._destroyed) {
            for (let i = 0, len = this.tr.cfg.param.lodNum; i < len; i++)
                if (this._t3ds[i])
                    this._t3ds[i].destroy();
            this._destroyed = true;
        }
    }
}
import { VertexMesh } from "laya/RenderEngine/RenderShader/VertexMesh";
import { Camera } from "laya/d3/core/Camera";
import { Material } from "laya/d3/core/material/Material";
import { Matrix4x4 } from "laya/maths/Matrix4x4";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { InstanceVertexDec } from "../instance/MeshInstanceBuffer";
import { Vector3 } from 'laya/maths/Vector3';
import { VertexDeclaration } from 'laya/RenderEngine/VertexDeclaration';
import { VertexElement } from "laya/renders/VertexElement";
import { VertexElementFormat } from "laya/renders/VertexElementFormat";
import { BoundBox } from 'laya/d3/math/BoundBox';
import { BaseInstanceMgr, _BaseMapItem } from '../instance/BaseInstanceMgr';
import { RenderableSprite3D } from 'laya/d3/core/RenderableSprite3D';
import { CustomDrawMeshInstanceCMD } from '../instance/CustomDrawMeshInstanceCMD';
import { BaseTexture } from 'laya/resource/BaseTexture';
import { Laya } from 'Laya';

/**
 * 树木渲染数据
 */
export interface ITreeInstanceData {
    id: number,
    mesh: Mesh,
    matrix: Matrix4x4,
    texture: BaseTexture,
    material: Material,
    kind: number, //树木形状编号
    grow: number, //生长系数（0~1）
    dist: number, //距离系数（0~1）
    drop: number, //下垂系数（-2,2)
    hidePot: number, //是否隐藏花盆
    luminance: number, //亮度系数
    saturation: number, //色度系数
    hue: number, //色相系数
    flash: number, //闪烁系数（展示被选中）
}

interface _InstanceFilterItem {
    posArray: number[][];
    forwardId: number;
    csId: number;
    drawNum: number;
}

interface _IDataMapItem {
    data: ITreeInstanceData,
    /** 上一次绘制的时间 */
    renderTime: number,
    /** 上一次绘制阴影的时间 */
    casterShadowTime: number,
    filterItem?: _InstanceFilterItem,
}

interface _TreeMapItem extends _BaseMapItem {
    texture: BaseTexture,
}

export class TreeInstanceManager extends BaseInstanceMgr<_TreeMapItem>{
    private static _vd: VertexDeclaration;
    private static _dec: InstanceVertexDec;
    private static _temp32: Float32Array;

    static __init__() {
        this._vd = new VertexDeclaration(112,
            [
                new VertexElement(0, VertexElementFormat.Vector4, VertexMesh.MESH_WORLDMATRIX_ROW0),
                new VertexElement(16, VertexElementFormat.Vector4, VertexMesh.MESH_WORLDMATRIX_ROW1),
                new VertexElement(32, VertexElementFormat.Vector4, VertexMesh.MESH_WORLDMATRIX_ROW2),
                new VertexElement(48, VertexElementFormat.Vector4, VertexMesh.MESH_WORLDMATRIX_ROW3),
                new VertexElement(64, VertexElementFormat.Vector4, VertexMesh.MESH_CUSTOME0),
                new VertexElement(80, VertexElementFormat.Vector4, VertexMesh.MESH_CUSTOME1),
                new VertexElement(96, VertexElementFormat.Vector4, VertexMesh.MESH_CUSTOME2),
            ]);

        const size = 28;
        this._dec = {
            vd: this._vd,
            cls: Float32Array,
            size: size,
            step: 1
        };

        this._temp32 = new Float32Array(size);
    }

    private _lastRenderTime = 0;
    private _lastCasterShadowTime = 0;

    private _needUpdate = true;
    private _boundBox = new BoundBox(new Vector3(), new Vector3());

    private _curSpritesMap: Map<string, _IDataMapItem> = new Map();

    constructor(camera: Camera, layer = 0, casterShadow = false) {
        super(camera, layer, casterShadow);
    }

    private _getKey(id: number, part: number) {
        return id + "_" + part;
    }

    /**
     * 更新渲染数据
     */
    updateByRenderData(datas: ITreeInstanceData[], casterShadow = false) {
        const map = this._curSpritesMap;
        const loopCount = Laya.timer.currFrame;
        const scBool = casterShadow && !this.casterShadow;
        for (let i = 0, len = datas.length; i < len; i++) {
            const data = datas[i];
            const key = this._getKey(data.id, 0);
            let item = this._curSpritesMap.get(key);
            let needAdd = false;
            if (!item) {
                needAdd = true;
                item = {
                    data: data,
                    renderTime: 0,
                    casterShadowTime: 0
                };
                map.set(key, item);
            } else {
                if (scBool)
                    needAdd = !this._lastCasterShadowTime || item.casterShadowTime != this._lastCasterShadowTime;
                else needAdd = !this._lastRenderTime || item.renderTime != this._lastRenderTime;
            }

            if (needAdd) // add or update
                this._addRenderableData(data, item, casterShadow);
            else this._updateRenderData(data, item, casterShadow);

            if (scBool) item.casterShadowTime = loopCount; //更新标记
            else item.renderTime = loopCount; //更新标记
        }

        if (!scBool) {
            map.forEach((item, id) => {
                if (item.renderTime && item.renderTime != loopCount) {
                    this._removeRenderData(item.data, item, false); //清理
                    item.renderTime = 0;
                }

                if (item.casterShadowTime && item.casterShadowTime != loopCount) { //删除多余的
                    this._removeRenderData(item.data, item, true);
                    item.casterShadowTime = 0;
                }

                if (!item.casterShadowTime && !item.renderTime)
                    map.delete(id);
            });
        }

        if (scBool)
            this._lastCasterShadowTime = loopCount; //更新标记
        else this._lastRenderTime = loopCount; //更新标记
    }

    protected getCommandBuffer(material: Material, casterShadow: boolean) {
        if (this.casterShadow) {
            if (material.renderQueue == Material.RENDERQUEUE_TRANSPARENT)
                return this.transparentQueue;
            return this.opaqueQueue;
        } else {
            if (casterShadow)
                return this.shadowCasterQueue;
            else {
                if (material.renderQueue == Material.RENDERQUEUE_TRANSPARENT)
                    return this.transparentQueue;
                return this.opaqueQueue;
            }
        }
    }

    update() {
        super.update();
        
    }

    /**
     * 更新渲染的instance状态
     * @param data 
     * @param casterShadow 
     */
    updateRenderData(data: ITreeInstanceData, casterShadow = false) {
        const item = this._curSpritesMap.get(this._getKey(data.id, 0));
        if (!item) return null;
        this._updateRenderData(data, item, casterShadow);
    }

    private _updateRenderData(data: ITreeInstanceData, mapItem: _IDataMapItem, casterShadow = false) {
        const item = mapItem.filterItem;
        if (!item) return;

        const mesh = data.mesh;
        const material = data.material;
        const texture = data.texture;
        if (!texture) return;

        const needClear: number[] = []; //需要清理id列表
        const id = casterShadow ? item.csId : item.forwardId;
        const tempfloat32 = this.getTempFloat32(data);
        const infoKey = this._getInfoKey(mesh, material, texture, casterShadow);
        let info: _TreeMapItem;

        if (this.mapShadow[infoKey] != id) {
            needClear.push(id);
            info = this.getMapItemByKey(infoKey) || this._createBuffer(mesh, material, texture, casterShadow);
            const infoid = info.id;

            const pos = this._access.append(infoid, tempfloat32, 1);
            casterShadow ? item.csId = infoid : item.forwardId = infoid;
            item.posArray[infoid] = pos;
            mapItem.data = data;
        } else this._access.update(id, item.posArray[id][0], tempfloat32);

        if (needClear && needClear.length) {
            for (let i = 0, len = needClear.length; i < len; i++) {
                const id = needClear[i];
                this._access.remove(id, item.posArray[id]);
                item.posArray[id] = null;
            }
        }
        this._needUpdate = true;
    }

    /**
     * 根据渲染节点添加instance
     */
    addRenderableData(data: ITreeInstanceData, casterShadow = false) {
        const item = this._curSpritesMap.get(this._getKey(data.id, 0));
        if (!item) return null;
        this._addRenderableData(data, item, casterShadow);
    }

    private _addRenderableData(data: ITreeInstanceData, mapItem: _IDataMapItem, casterShadow = false) {
        let item = mapItem.filterItem; //查重
        if (!item) {
            item = {
                posArray: [],
                drawNum: 0,
                forwardId: -1,
                csId: -1,
            };
            mapItem.filterItem = item;
        }

        const material = data.material;
        const mesh = data.mesh;
        const texture = data.texture;
        if (!texture) return;

        const tempfloat32 = this.getTempFloat32(data);
        let info = this.findInfo(mesh, material, texture, casterShadow);
        if (!info)
            info = this._createBuffer(mesh, material, texture, casterShadow);

        const infoid = info.id;
        if (casterShadow && item.csId != -1) return;
        else if (!casterShadow && item.forwardId != -1) return;

        const pos = this._access.append(infoid, tempfloat32, 1);
        item.posArray[infoid] = pos;

        if (casterShadow)
            item.csId = infoid;
        else item.forwardId = infoid;

        item.drawNum++;
        this._needUpdate = true;
    }

    removeRenderData(data: ITreeInstanceData, casterShadow = false) {
        const item = this._curSpritesMap.get(this._getKey(data.id, 0));
        if (!item) return null;
        this._removeRenderData(data, item, casterShadow);
    }

    private _removeRenderData(data: ITreeInstanceData, mapItem: _IDataMapItem, casterShadow = false) {
        const item = mapItem.filterItem;
        if (!item) return false;

        let id = 0;
        if (casterShadow) {
            id = item.csId;
            item.csId = -1
        }
        else {
            id = item.forwardId;
            item.forwardId = -1;
        }

        if (id == -1) return;

        this._access.remove(id, item.posArray[id]);
        item.posArray[id] = null;

        item.drawNum--;
        if (!item.drawNum)
            mapItem.filterItem = null;
        this._needUpdate = true;
    }

    /**
     * @param mesh 
     * @param material 
     * @param texture 
     * @param casterShadow 
     * @returns 
     */
    protected _createBuffer(mesh: Mesh, material: Material, texture: BaseTexture, casterShadow = false) {
        const subMeshIndex = -1;
        const subShaderIndex = 0;
        if (material.renderQueue == Material.RENDERQUEUE_OPAQUE)
            material.shaderData.addDefine(RenderableSprite3D.SHADERDEFINE_RECEIVE_SHADOW)
        const cmd = new CustomDrawMeshInstanceCMD(material, 0, this._layer);
        const cmdbuf = this.getCommandBuffer(material, casterShadow); //@ts-ignore
        cmd._commandBuffer = cmdbuf;

        const info: _TreeMapItem = {
            mesh: mesh,
            material: material,
            texture: texture,
            subShaderIndex: subShaderIndex,
            subMeshIndex: subMeshIndex,
            cmdbuffer: cmdbuf,
            id: -1,// 添加进去之后初始化
            cmd: cmd,
            ivdecs: TreeInstanceManager._dec
        }

        const key = this._getInfoKey(mesh, material, texture, casterShadow);

        this.addMapItem(info, key);
        //初始化数据
        const data = this._access.initID(info.id, [mesh], subMeshIndex, info.ivdecs);
        for (let i = 0, n = data.buffers.length; i < n; i++)
            cmd.addBuffer(data.buffers[i]);

        cmdbuf.addCustomCMD(cmd);
        return info;
    }

    getAccessData() {
        const out = [];
        this._access._dataMap.forEach((value, key) => {
            out.push({
                url: value.meshs[0].url,
                drawNum: value.drawNum,
                faceNum: value.meshs[0].indexCount / 3 * value.drawNum
            })
        });
        return out;
    }

    /**
     * 解析计算当前float32
     * @param sprite 
     * @returns 
     */
    getTempFloat32(data: ITreeInstanceData) {
        const matrix = data.matrix;
        const tempfloat32 = TreeInstanceManager._temp32;
        tempfloat32.set(matrix.elements);

        let i = 16;
        tempfloat32[i++] = data.kind;
        tempfloat32[i++] = data.grow;
        tempfloat32[i++] = data.dist;
        tempfloat32[i++] = data.drop;
        tempfloat32[i++] = data.hidePot;
        tempfloat32[i++] = data.luminance;
        tempfloat32[i++] = data.saturation;
        tempfloat32[i++] = data.hue;
        tempfloat32[i++] = data.flash;
        tempfloat32[i++] = 0;
        tempfloat32[i++] = 0;
        tempfloat32[i++] = 0;
        return tempfloat32;
    }

    /**
     * 寻找是否有info
     * @param mesh 
     * @param material 
     * @param lightMapIndex 
     * @param casterShadow 
     * @returns 
     */
    protected findInfo(mesh: Mesh, material: Material, texture: BaseTexture, casterShadow = false): _TreeMapItem {
        const key = this._getInfoKey(mesh, material, texture, casterShadow);
        return this._map[this.mapShadow[key]];
    }

    private _getInfoKey(mesh: Mesh, material: Material, texture: BaseTexture, casterShadow: boolean) {
        const cmdbuf = this.getCommandBuffer(material, casterShadow);
        return mesh.id + "_" + material.id + "_" + texture.id + "_" + cmdbuf.name;
    }

    clear() {
        super.clear();
        this._curSpritesMap.clear();
    }

    destroy() {
        super.destroy(); //@ts-ignore
        this.opaqueQueue.clear(); //@ts-ignore
        this.transparentQueue.clear(); //@ts-ignore
        this.shadowCasterQueue.clear();
    }
}
import { DataAccess, InstanceRenderInfo } from './DataAccess';
import { CustomDrawMeshInstanceCMD } from './CustomDrawMeshInstanceCMD';
import { Camera, CameraEventFlags } from "laya/d3/core/Camera";
import { Material } from "laya/d3/core/material/Material";
import { CommandBuffer } from "laya/d3/core/render/command/CommandBuffer";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { InstanceVertexDec } from "./MeshInstanceBuffer";

export interface _BaseMapItem {
    material: Material,
    mesh: Mesh,
    id: number,
    cmd: CustomDrawMeshInstanceCMD,
    ivdecs: InstanceVertexDec,
    subShaderIndex: number,
    subMeshIndex: number,
    cmdbuffer:CommandBuffer
}

/**
 * 不能单独实例化该对象
 */
export class BaseInstanceMgr<T extends _BaseMapItem> {
    protected _map: T[] = [];
    protected mapShadow:Record<string,number> = {};
    // protected _empty: number[] = [];

    _access: DataAccess;

    protected _camera: Camera;

    protected _hide = true;
    protected _layer = 0;

    protected casterShadow = false;

    opaqueQueue: CommandBuffer;// = new CommandBuffer("LayaMeInstance", false);
    /** 透明最开头 */
    transparentQueue: CommandBuffer;// = new CommandBuffer("LayaMeInstance", false);

    shadowCasterQueue:CommandBuffer;// = new CommandBuffer("LayaMeShadowCasterInstance",false);

    /**
     * 初始化instance管理器
     * @param camera 摄像机
     * @param layer 层级
     * @param casterShadow @default false 是否有阴影渲染,位false时需要单独的command渲染阴影
     */
    constructor(camera: Camera, layer = 0 , casterShadow = false) {
        this._camera = camera;
        this._access = new DataAccess();
        this._layer = layer;

        this.casterShadow = casterShadow;
        this.initCommadBuffer();
        this.hide = false;
    }

    set hide(value: boolean) {
        if (this._hide == value) {
            return
        }
        this._hide = value;
        this.onHideChange(value);
    }

    get hide() {
        return this._hide;
    }

    protected initCommadBuffer(){
        this.opaqueQueue = new CommandBuffer("LayaMeInstance", this.casterShadow);
        
        this.transparentQueue = new CommandBuffer("LayaMeInstance", this.casterShadow);

        if (!this.casterShadow) {
            this.shadowCasterQueue = new CommandBuffer("LayaMeShadowCasterInstance",false);
        }
    }
    
    protected onHideChange(value: boolean): void {
        if (this._camera.destroyed) {
            return;
        }

        if (value) {
            this._camera.removeCommandBuffer(CameraEventFlags.BeforeSkyBox, this.opaqueQueue);
            this._camera.removeCommandBuffer(CameraEventFlags.BeforeTransparent, this.transparentQueue);
            if (!this.casterShadow) { //@ts-ignore
                this._camera._removeCasterShadowCommandBuffer(this.shadowCasterQueue);
            }
        } else {
            this._camera.addCommandBuffer(CameraEventFlags.BeforeSkyBox, this.opaqueQueue);
            this._camera.addCommandBuffer(CameraEventFlags.BeforeTransparent, this.transparentQueue);
            if (!this.casterShadow) { //@ts-ignore
                this._camera._addCasterShadowCommandBuffer(this.shadowCasterQueue);
            }
        }
    }

    protected addMapItem(item:T,key:string){
        let id = this._map.length;
        this.mapShadow[key] = id;
        item.id = id;
        this._map[id] = item;
    }

    protected getMapItemByKey(key:string):T{
       return this._map[this.mapShadow[key]];
    }
 
    protected getCommandBuffer(...any):CommandBuffer{
        return null
    }

    /**
     * 创建buffer
     * @returns 
     */
    protected _createBuffer(...any):T {
        return null;
    }

    /**
     *  寻找是否有info
     * @returns 
     */
    protected findInfo(...args:any):T {
        throw new Error("Need Override!");
    }


    public update() {
        this._access.uploadAllBuffer();
    }

    clear() {
        this.hide = true;
        this._access.deleteAll();
        for (let i = 0, n = this._map.length; i < n; i++) {
            let item = this._map[i];
            if (item && item.cmd) {
                item.cmd.destroy(false);
            }
        }
        this._map.length = 0;
    }

    destroy() {
        this.clear();
    }
}
import { Command } from 'laya/d3/core/render/command/Command';
import { Material } from "laya/d3/core/material/Material";
import { MeshSprite3DShaderDeclaration } from "laya/d3/core/MeshSprite3DShaderDeclaration";
import { VertexMesh } from "laya/RenderEngine/RenderShader/VertexMesh";
import { SubMesh } from "laya/d3/resource/models/SubMesh";
import { DefineDatas } from "laya/RenderEngine/RenderShader/DefineDatas";
import { SubShader } from "laya/RenderEngine/RenderShader/SubShader";
import { MeshInstanceBuffer } from "./MeshInstanceBuffer";
import { VertexDeclaration } from 'laya/RenderEngine/VertexDeclaration';
import { Vector3 } from 'laya/maths/Vector3';
import { PrimitiveMesh } from 'laya/d3/resource/models/PrimitiveMesh';
import { RenderContext3D } from 'laya/d3/core/render/RenderContext3D';
import { RenderElement } from 'laya/d3/core/render/RenderElement';
import { MeshInstanceGeometry } from 'laya/d3/graphics/MeshInstanceGeometry';
import { BaseRender } from 'laya/d3/core/render/BaseRender';
import { BufferState } from "laya/webgl/utils/BufferState";
import { BaseUtils } from '../utils/BaseUtils';
import { BlinnPhongMaterial } from 'laya/d3/core/material/BlinnPhongMaterial';

export interface _QueueItem {
    buffer: MeshInstanceBuffer;
    renderElements: RenderElement[];
    instanceGeometrys: MeshInstanceGeometry[];
}

export class CustomDrawMeshInstanceCMD extends Command {
    static compileDefine: DefineDatas
    static _fakerMat: BlinnPhongMaterial;
    static _vd: VertexDeclaration;
    static __init__(): void {
        CustomDrawMeshInstanceCMD._vd = VertexMesh.getVertexDeclaration("POSITION,NORMAL");
        CustomDrawMeshInstanceCMD.compileDefine = new DefineDatas();
        CustomDrawMeshInstanceCMD._fakerMat = new BlinnPhongMaterial();
        CustomDrawMeshInstanceCMD._fakerMat.lock = true;
    }

    _material: Material;
    set material(value:Material){
        if(this._material!=value){
            this._material && this._material._removeReference(1);
            this._material = value;
            this._material && this._material._addReference(1);
        }
    }
    
    get material():Material{
        return this._material;
    }
    subShaderIndex: number;

    _queue: _QueueItem[] = [];

    /**@internal */
    _render: BaseRender;

    get cmdRender(){
        return this._render;
    }

    private _layer = 0;
    constructor(material: Material, subShaderIndex: number, layer = 0) {
        super();

        this.material = material;
        this.subShaderIndex = subShaderIndex;
        this._render = new BaseRender();
        // this.receiveShadow = true;
        //@ts-ignore
        let shaderdata = this._render._shaderValues;
        // shaderdata.setVector(RenderableSprite3D.REFLECTIONCUBE_HDR_PARAMS, new Vector4(5,0,0,1));
        shaderdata.addDefine(MeshSprite3DShaderDeclaration.SHADERDEFINE_GPU_INSTANCE);
        // shaderdata.addDefine(RenderableSprite3D.SAHDERDEFINE_LIGHTMAP);
        this._layer = layer;
    }

    set castShadow(value:boolean){
        this._render.castShadow = value;
    }

    get castShadow(){
        return this._render.castShadow;
    }



    set receiveShadow(value:boolean){
        this._render.receiveShadow = value;
    }

    get receiveShadow(){
        return this._render.receiveShadow;
    }

    updateMaterial(mat: Material) {
        this.material = mat;
    }

    /**
     * 添加对应的meshbuffer
     * @param meshbuffer 
     */
    addBuffer(meshbuffer: MeshInstanceBuffer) {
        if (meshbuffer._owner != this) {
            if (meshbuffer._owner) {
                meshbuffer._owner.removeBuffer(meshbuffer);
            }
            let index = this._queue.length;
            this._initRender(meshbuffer, index);
        }
    }

    /**
     * 初始化对应的renderElement
     * @param buffer 
     * @param index 
     */
    private _initRender(buffer: MeshInstanceBuffer, index: number) {
        //@ts-ignore
        let submeshs = buffer.mesh._subMeshes;
        let renderElements = [];
        let instanceGeos = []
        if (buffer.subMeshIndex == -1) {
            for (let i = 0, len = submeshs.length; i < len; i++) {
                let element = renderElements[i] = new RenderElement();
                let geometry = instanceGeos[i] = new MeshInstanceGeometry(submeshs[i]); //@ts-ignore
                element.setGeometry(geometry);
                // element.transform = this._transform;
                // element.material = this.material;
                // element.renderSubShader = this.material._shader.getSubShaderAt(this.subShaderIndex);
                //@ts-ignore
                element.render = this._render;
                // geometry.bufferState = buffer.instanceBufferState;
                // geometry.instanceCount = this._drawnums;         
            }
        } else {
            let element = renderElements[0] = new RenderElement();
            let geometry = instanceGeos[0] = new MeshInstanceGeometry(submeshs[buffer.subMeshIndex]);
            //@ts-ignore
            element.setGeometry(geometry);
            // element.transform = this._transform;
            // element.material = this.material;
            //@ts-ignore
            element.render = this._render;
            // element.renderSubShader = this.material._shader.getSubShaderAt(this.subShaderIndex);
            // geometry.bufferState = buffer.instanceBufferState;
            // geometry.instanceCount = this._drawnums;
        }

        //@ts-ignore
        BaseUtils.meshDefineAdd(buffer.mesh, this._render._shaderValues);

        this._queue[index] = {
            renderElements: renderElements,
            instanceGeometrys: instanceGeos,
            buffer: buffer
        }
        buffer._owner = this;
        buffer.__queueIndex = index;
    }

    /**
     * 移除一个buffer
     * @param meshbuffer 
     */
    removeBuffer(meshbuffer: MeshInstanceBuffer) {
        if (meshbuffer._owner == this) {
            this._queue.splice(meshbuffer.__queueIndex, 1);
            meshbuffer._owner = null;
            meshbuffer.__queueIndex = -1;
        }
    }

    /**
     * 移除所有buffer
     */
    removeAllBuffer() {
        if (this._queue) {
            for (let i = 0, n = this._queue.length; i < n; i++) {
                // this._queue[i]._owner = null;
                let item = this._queue[i];
                if (item) {
                    item.buffer._owner = null;
                    item.buffer.__queueIndex = -1;
                }
            }
            this._queue.length = 0;
        }
    }

    run() {
        //@ts-ignore
        let context = this._commandBuffer._context;
        //已经被销毁
        if (!this._queue || !this._queue.length || !this._needRender(context)) {
            return;
        }
        //TODO 引擎升级  
        // if(context.scene){
        //     this._render._shaderValues.setVector(RenderableSprite3D.REFLECTIONCUBE_HDR_PARAMS,context.scene._reflectionCubeHDRParams);
        // }
        this.setContext(context);
        this.render(context);
    }

    private _needRender(context: RenderContext3D) {
        //@ts-ignore
        let camera = context.camera;

        if (context.pipelineMode == "Forward") {
            let cullMask: number = camera.cullingMask;
            if ((Math.pow(2, this._layer) & cullMask) == 0) {
                return false;
            }
        }

        for (let i = 0; i < this._queue.length; i++) {
            if (this._queue[i] && this._queue[i].buffer && this._queue[i].buffer.drawNums) return true
        }
        return false
    }

    render(context: RenderContext3D) {
        //@ts-ignore
        this._render.probReflection = context.scene.sceneReflectionProb;
        this._render._applyReflection();
        // context.scene._volumeManager.reflectionProbeManager._updateRenderObject(this._render);
        let needreplace = false;
        let renderSubShader; //@ts-ignore
        if (context.replaceTag && context.customShader) {
            let _fakerMat = CustomDrawMeshInstanceCMD._fakerMat; //@ts-ignore
            let subshader = _fakerMat._shader.getSubShaderAt(this.subShaderIndex); //@ts-ignore
            var oriTag: string = subshader.getFlag(context.replaceTag);
            if (oriTag) { //@ts-ignore
                var customSubShaders: SubShader[] = context.customShader._subShaders;
                for (var k: number = 0, p: number = customSubShaders.length; k < p; k++) {
                    var customSubShader: SubShader = customSubShaders[k]; //@ts-ignore
                    if (oriTag === customSubShader.getFlag(context.replaceTag)) {
                        renderSubShader = customSubShader;
                        break;
                    }
                }
            }

            if (!renderSubShader) {
                return
            }

            needreplace = true;
        } else { //@ts-ignore
            renderSubShader = this.material._shader.getSubShaderAt(this.subShaderIndex);
        }

        let material = needreplace ? CustomDrawMeshInstanceCMD._fakerMat : this.material;

        for (let i = 0, len = this._queue.length; i < len; i++) {
            let item = this._queue[i];
            if (item && item.buffer && item.buffer.drawNums) {
                let buffer = item.buffer; //@ts-ignore
                let submeshs = buffer.mesh._subMeshes;
                if (!submeshs) {
                    continue;
                }
                if (buffer.subMeshIndex !== -1 || (needreplace && buffer.hasFaker)) {
                    let element = item.renderElements[0];
                    let geometry = item.instanceGeometrys[0];

                    let submesh: SubMesh, state: BufferState;
                    if (needreplace && buffer.hasFaker) {//假的渲染 
                        submesh = buffer.faker.getSubMesh(0);
                        state = buffer.fakerState;
                    } else {
                        submesh = submeshs[buffer.subMeshIndex];
                        state = buffer.instanceBufferState;
                    }
                    geometry.subMesh = submesh;
                    //@ts-ignore
                    element.material = material; //@ts-ignore
                    element.renderSubShader = renderSubShader;
                    geometry.bufferState = state;
                    geometry.instanceCount = buffer.drawNums;
                    context.drawRenderElement(element);
                }
                else {
                    for (let i = 0, len = submeshs.length; i < len; i++) {
                        let element = item.renderElements[i];
                        let geometry = item.instanceGeometrys[i];
                        geometry.subMesh = submeshs[i];
                        //@ts-ignore
                        element.material = material;
                        //@ts-ignore
                        element.renderSubShader = renderSubShader;
                        geometry.bufferState = buffer.instanceBufferState;
                        geometry.instanceCount = buffer.drawNums;
                        context.drawRenderElement(element);
                    }
                }

            }
        }
    }

    /**
     * 销毁
     * @param destroyMeshbuf 是否同步销毁队列中的meshbuffer
     */
    destroy(destroyMeshbuf: boolean = false) {
        if (destroyMeshbuf) {
            for (let i = this._queue.length - 1; i > -1; i--) {
                // this._queue[i].destroy();
                let item = this._queue[i];
                if (item) {
                    item.buffer.destroy();
                }
            }
            this._queue.length = 0;
        }
        this._queue = null;
        this._render.destroy();
        //@ts-ignore
        this._render._onDestroy();
        this._render = null;
        this.material = null;
    }


    static createFakeMesh(min: Vector3, max: Vector3) {
        var vertexDeclaration: VertexDeclaration = CustomDrawMeshInstanceCMD._vd;
        var maxheight = Math.abs(max.y - min.y);
        var halfLong: number = Math.abs(max.x - min.x) / 2;
        var halfWidth: number = Math.abs(max.z - min.z) / 2;

        var vertices: Float32Array = new Float32Array([
            //上
            -halfLong, maxheight, -halfWidth, 0, 1, 0,
            halfLong, maxheight, -halfWidth, 0, 1, 0,
            halfLong, maxheight, halfWidth, 0, 1, 0,
            -halfLong, maxheight, halfWidth, 0, 1, 0,
            //下
            -halfLong, 0, -halfWidth, 0, -1, 0,
            halfLong, 0, -halfWidth, 0, -1, 0,
            halfLong, 0, halfWidth, 0, -1, 0,
            -halfLong, 0, halfWidth, 0, -1, 0,
            //左
            -halfLong, maxheight, -halfWidth, -1, 0, 0,
            -halfLong, maxheight, halfWidth, -1, 0, 0,
            -halfLong, 0, halfWidth, -1, 0, 0,
            -halfLong, 0, -halfWidth, -1, 0, 0,
            //右
            halfLong, maxheight, -halfWidth, 1, 0, 0,
            halfLong, maxheight, halfWidth, 1, 0, 0,
            halfLong, 0, halfWidth, 1, 0, 0,
            halfLong, 0, -halfWidth, 1, 0, 0,
            //前
            -halfLong, maxheight, halfWidth, 0, 0, 1,
            halfLong, maxheight, halfWidth, 0, 0, 1,
            halfLong, 0, halfWidth, 0, 0, 1,
            -halfLong, 0, halfWidth, 0, 0, 1,
            //后
            -halfLong, maxheight, -halfWidth, 0, 0, -1,
            halfLong, maxheight, -halfWidth, 0, 0, -1,
            halfLong, 0, -halfWidth, 0, 0, -1,
            -halfLong, 0, -halfWidth, 0, 0, -1
        ]);

        var indices: Uint16Array = new Uint16Array([
            //上
            0, 1, 2, 2, 3, 0,
            //下
            4, 7, 6, 6, 5, 4,
            //左
            8, 9, 10, 10, 11, 8,
            //右
            12, 15, 14, 14, 13, 12,
            //前
            16, 17, 18, 18, 19, 16,
            //后
            20, 23, 22, 22, 21, 20
        ]);

        //@ts-ignore
        return PrimitiveMesh._createMesh(vertexDeclaration, vertices, indices);
    }
}
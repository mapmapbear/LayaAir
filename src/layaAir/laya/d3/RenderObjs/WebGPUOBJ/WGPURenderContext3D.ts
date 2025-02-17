import { WebGPURenderPassDescriptor } from "../../../RenderEngine/RenderEngine/WebGPUEngine/WebGPURenderPassDescriptor";
import { WebGPUEngine } from "../../../RenderEngine/RenderEngine/WebGPUEngine/WebGPUEngine";
import { WebGPURenderCommandEncoder } from "../../../RenderEngine/RenderEngine/WebGPUEngine/WebGPURenderCommandEncoder";
import { IRenderTarget } from "../../../RenderEngine/RenderInterface/IRenderTarget";
import { IRenderContext3D, PipelineMode } from "../../../RenderEngine/RenderInterface/RenderPipelineInterface/IRenderContext3D";
import { LayaGL } from "../../../layagl/LayaGL";
import { Vector4 } from "../../../maths/Vector4";
import { Viewport } from "../../math/Viewport";
import { WGPURenderElementObJ } from "./WGPURenderElementObJ";
import { WGPUShaderData } from "./WGPUShaderData";
import { WebGPUInternalRT } from "../../../RenderEngine/RenderEngine/WebGPUEngine/WebGPUInternalRT";

export class WGPURenderContext3D implements IRenderContext3D {
    
    device:GPUDevice;//TODO
    //dest Texture
    private _destTarget: IRenderTarget;
    public get destTarget(): IRenderTarget {
        return this._destTarget;
    }
    public set destTarget(value: IRenderTarget) {
        this._destTarget = value;
        this.internalRT = this._destTarget._renderTarget as WebGPUInternalRT;
    }

    internalRT:WebGPUInternalRT;
    //viewPort
    viewPort: Viewport;
    //scissor
    scissor: Vector4;
    //is invert Y
    invertY: boolean;
    //pipeLineMode
    pipelineMode: PipelineMode;
    //Camera Shader Data
    cameraShaderData: WGPUShaderData;
    //Scene cache
    sceneID: number;
    //scene Shader Data
    sceneShaderData: WGPUShaderData;
    //Camera Update Mark
    cameraUpdateMark: number;
    //Global ShaderData
    globalShaderData: WGPUShaderData;
    //渲染命令
    commandEncoder:WebGPURenderCommandEncoder;
    //render Pass Attach cache
    renderPassDec:WebGPURenderPassDescriptor;
    
    
    constructor(){
        this.viewPort = new Viewport(0,0,0,0);
        this.scissor = new Vector4();
        this.pipelineMode = "Forward"
        //TODO
        this.commandEncoder = new WebGPURenderCommandEncoder();
        this.renderPassDec = new WebGPURenderPassDescriptor();
        this.device = (LayaGL.renderEngine as WebGPUEngine )._device;
    }
    
    /**设置IRenderContext */
    applyContext(cameraUpdateMark: number): void{
        this.destTarget && this.destTarget._start();
        this._startRender();
        this.cameraUpdateMark = cameraUpdateMark;
    }

    /**draw one element by context */
    drawRenderElement(renderelemt: WGPURenderElementObJ): void{
        this.destTarget && this.destTarget._start();
        this._startRender();
        this.end();
    }

    /**end Encoder orcall submit render*/
    end(){
        this.commandEncoder.end();
        this.device.queue.submit([this.commandEncoder.finish()]);
        this.internalRT.loadClear = false;
    }

    /**
     * Render pre 
     */
    private _startRender(){
        this.internalRT = (LayaGL.renderEngine as WebGPUEngine)._cavansRT;
        (LayaGL.renderEngine as WebGPUEngine).setRenderPassDescriptor(this.internalRT,this.renderPassDec);
        this.commandEncoder.startRender(this.renderPassDec.des);
    }

    //TODO delete
    
}
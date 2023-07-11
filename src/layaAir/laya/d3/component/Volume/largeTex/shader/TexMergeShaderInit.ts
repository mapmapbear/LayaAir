import TexMergeVS from "./TexMerge.vs";
import TexMergeFS from "./TexMerge.fs";
import { VertexMesh } from "laya/RenderEngine/RenderShader/VertexMesh";
import { ShaderDataType } from "laya/RenderEngine/RenderShader/ShaderData";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { SubShader } from "laya/RenderEngine/RenderShader/SubShader";
import { RenderState } from "laya/RenderEngine/RenderShader/RenderState";
import { ShaderDefine } from "laya/RenderEngine/RenderShader/ShaderDefine";

export class TexMergeShaderInit {
    static inited: boolean = false;
    static init() {
        if (this.inited) return;
        const attributeMap: { [name: string]: [number, ShaderDataType] } = {
            "a_PositionTexcoord": [VertexMesh.MESH_POSITION0, ShaderDataType.Vector4]
        };

        const uniformMap = {
            "u_MainTex": ShaderDataType.Texture2D,
            "u_OffsetScale": ShaderDataType.Vector4,
        };

        const shader = Shader3D.add("TexMerge");
        const subShader = new SubShader(attributeMap, uniformMap);
        shader.addSubShader(subShader);
        const blitPass = subShader.addShaderPass(TexMergeVS, TexMergeFS);
        const blitState = blitPass.renderState;
        blitState.depthTest = RenderState.DEPTHTEST_ALWAYS;
        blitState.depthWrite = false;
        blitState.cull = RenderState.CULL_NONE;
        blitState.blend = RenderState.BLEND_DISABLE;
        this.inited = true;
    }
}
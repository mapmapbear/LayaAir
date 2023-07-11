import { VertexMesh } from "laya/RenderEngine/RenderShader/VertexMesh";
import { Color } from "laya/maths/Color";
import { SubShader } from "laya/RenderEngine/RenderShader/SubShader";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { ShaderDataType } from "laya/RenderEngine/RenderShader/ShaderData";
import { Vector4 } from "laya/maths/Vector4";
import ImposterFS from "./Imposter.fs";
import ImposterVS from "./Imposter.vs";

export class ImposterShaderInit {
    static __init__() {
        const attributeMap: { [name: string]: [number, ShaderDataType] } = {
            'a_Position': [VertexMesh.MESH_POSITION0, ShaderDataType.Vector4],
            'a_Normal': [VertexMesh.MESH_NORMAL0, ShaderDataType.Vector3],
            'a_Color': [VertexMesh.MESH_COLOR0, ShaderDataType.Vector4],
            'a_Tangent0': [VertexMesh.MESH_TANGENT0, ShaderDataType.Vector4],
            'a_Texcoord0': [VertexMesh.MESH_TEXTURECOORDINATE0, ShaderDataType.Vector2],
            'a_Texcoord1': [VertexMesh.MESH_TEXTURECOORDINATE1, ShaderDataType.Vector2],
            'a_WorldMat': [VertexMesh.MESH_WORLDMATRIX_ROW0, ShaderDataType.Matrix4x4],
            'a_InstanceParam1': [VertexMesh.MESH_CUSTOME0, ShaderDataType.Vector4],
            'a_InstanceParam2': [VertexMesh.MESH_CUSTOME1, ShaderDataType.Vector4],
        }

        const uniformMap = {
            'u_AlbedoTexture': ShaderDataType.Texture2D,
            'u_AlbedoColor': ShaderDataType.Color,
            'u_AlbedoIntensity': ShaderDataType.Float,
            'u_MaterialSpecular': ShaderDataType.Color,
            'u_AlphaTestValue': ShaderDataType.Float,
            'u_Shininess': ShaderDataType.Float,
            'u_TilingOffset': ShaderDataType.Vector4,
            'u_Scale': ShaderDataType.Float,
        };

        const defaultValue = {
            'u_AlbedoIntensity': 1,
            'u_AlbedoColor': Color.WHITE,
            'u_MaterialSpecular': new Color(0.1, 0.1, 0.1, 1),
            'u_AlphaTestValue': 0.5,
            'u_Shininess': 1,
            'u_TilingOffset': new Vector4(1, 1, 0, 0),
            'u_Scale': 1,
        }

        const shader = Shader3D.add("TreeImposterShader", true);
        const subShader = new SubShader(attributeMap, uniformMap, defaultValue);
        shader.addSubShader(subShader);
        subShader.addShaderPass(ImposterVS, ImposterFS);
        //subShader.addShaderPass(ImposterDepthVS, ImposterDepthFS, "ShadowCaster");
    }
}
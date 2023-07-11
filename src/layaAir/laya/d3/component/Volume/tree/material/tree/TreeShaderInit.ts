import { VertexMesh } from "laya/RenderEngine/RenderShader/VertexMesh";
import { Color } from "laya/maths/Color";
import { SubShader } from "laya/RenderEngine/RenderShader/SubShader";
import { Shader3D } from "laya/RenderEngine/RenderShader/Shader3D";
import { ShaderDataType } from "laya/RenderEngine/RenderShader/ShaderData";
import { Vector4 } from "laya/maths/Vector4";
import TreeFS from "./Tree.fs";
import TreeVS from "./Tree.vs";
import TreeDepthVS from "./TreeDepth.vs";
import TreeDepthFS from "./TreeDepth.fs";

export class TreeShaderInit {
    static __init__() {
        const attributeMap: { [name: string]: [number, ShaderDataType] } = {
            'a_Position': [VertexMesh.MESH_POSITION0, ShaderDataType.Vector4],
            'a_Normal': [VertexMesh.MESH_NORMAL0, ShaderDataType.Vector3],
            'a_Color': [VertexMesh.MESH_COLOR0, ShaderDataType.Vector4],
            'a_Tangent0': [VertexMesh.MESH_TANGENT0, ShaderDataType.Vector4],
            'a_Texcoord0': [VertexMesh.MESH_TEXTURECOORDINATE0, ShaderDataType.Vector2],
            'a_Texcoord1': [VertexMesh.MESH_TEXTURECOORDINATE1, ShaderDataType.Vector2],
            'a_BoneWeights': [VertexMesh.MESH_BLENDWEIGHT0, ShaderDataType.Vector4],
            'a_WorldMat': [VertexMesh.MESH_WORLDMATRIX_ROW0, ShaderDataType.Matrix4x4],
            // 'a_InstanceParam1': [VertexMesh.MESH_CUSTOME0, ShaderDataType.Vector4],
            // 'a_InstanceParam2': [VertexMesh.MESH_CUSTOME1, ShaderDataType.Vector4],
            // 'a_InstanceParam3': [VertexMesh.MESH_CUSTOME2, ShaderDataType.Vector4],
        }

        const uniformMap = {
            'u_ParamTexture': ShaderDataType.Texture2D,
            'u_AlbedoTexture': ShaderDataType.Texture2D,
            'u_DiffuseColor': ShaderDataType.Color,
            'u_AlbedoIntensity': ShaderDataType.Float,
            'u_MaterialSpecular': ShaderDataType.Color,
            'u_Shininess': ShaderDataType.Float,
            'u_TilingOffset': ShaderDataType.Vector4,

            'u_Season': ShaderDataType.Float,
            'u_ParamWind': ShaderDataType.Vector4,
            'u_ParamSize': ShaderDataType.Float,
            'u_ParamStride': ShaderDataType.Float,
            'u_TreeHeight': ShaderDataType.Float,
            'u_TreeCodeMax': ShaderDataType.Float,
            'u_BranchCodeMax': ShaderDataType.Float,

            'u_InstanceParam1': ShaderDataType.Vector4,
            'u_InstanceParam2': ShaderDataType.Vector4,
            'u_InstanceParam3': ShaderDataType.Vector4
        };

        const defaultValue = {
            'u_AlbedoIntensity': 1,
            'u_DiffuseColor': Color.WHITE,
            'u_MaterialSpecular': new Color(0.1, 0.1, 0.1, 1),
            'u_Shininess': 1,
            'u_TilingOffset': new Vector4(1, 1, 0, 0),
            'u_ParamWind': new Vector4(1, 1, 0, 0),

            'u_Season': 0,
            'u_ParamSize': 256,
            'u_ParamStride': 0,
            'u_TreeHeight': 10,
            'u_TreeCodeMax': 0,
            'u_BranchCodeMax': 0,
        }

        const shader = Shader3D.add("TreeShader", true);
        const subShader = new SubShader(attributeMap, uniformMap, defaultValue);
        shader.addSubShader(subShader);
        subShader.addShaderPass(TreeVS, TreeFS);
        // subShader.addShaderPass(TreeDepthVS, TreeDepthFS, "ShadowCaster");
    }
}
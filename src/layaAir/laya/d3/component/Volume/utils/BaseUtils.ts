import { MeshSprite3DShaderDeclaration } from "laya/d3/core/MeshSprite3DShaderDeclaration";
import { VertexMesh } from "laya/RenderEngine/RenderShader/VertexMesh";
import { VertexElement } from "laya/renders/VertexElement";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { SubMesh } from "laya/d3/resource/models/SubMesh";
import { ShaderData } from "laya/RenderEngine/RenderShader/ShaderData";

export class BaseUtils {
    static meshDefineAdd(mesh: Mesh, renderShaderValue: ShaderData) {
        for (var i: number = 0, n: number = mesh.subMeshCount; i < n; i++) {
            var subMesh: SubMesh = (<SubMesh>mesh.getSubMesh(i)); //@ts-ignore
            var vertexElements: any[] = subMesh._vertexBuffer._vertexDeclaration._vertexElements;
            for (var j: number = 0, m: number = vertexElements.length; j < m; j++) {
                var vertexElement: VertexElement = vertexElements[j];
                var name: number = vertexElement.elementUsage;
                switch (name) {
                    case VertexMesh.MESH_COLOR0:
                        renderShaderValue.addDefine(MeshSprite3DShaderDeclaration.SHADERDEFINE_COLOR);
                        break
                    case VertexMesh.MESH_TEXTURECOORDINATE0:
                        renderShaderValue.addDefine(MeshSprite3DShaderDeclaration.SHADERDEFINE_UV0);
                        break;
                    case VertexMesh.MESH_TEXTURECOORDINATE1:
                        renderShaderValue.addDefine(MeshSprite3DShaderDeclaration.SHADERDEFINE_UV1);
                        break;
                    case VertexMesh.MESH_TANGENT0:
                        renderShaderValue.addDefine(MeshSprite3DShaderDeclaration.SHADERDEFINE_TANGENT);
                        break;
                }
            }
        }
    }
}
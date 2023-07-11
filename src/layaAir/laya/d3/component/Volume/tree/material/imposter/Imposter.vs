#define SHADER_NAME TreeImposterVS

#include "Scene.glsl";
#include "Camera.glsl";
#include "Sprite3DCommon.glsl";
#include "SceneFogInput.glsl";

varying vec2 v_TexCoord;
varying vec4 v_adjHSL; //颜色调节

// void main() {
// 	float luminance = a_InstanceParam2.y;
// 	float saturation = a_InstanceParam2.z;
// 	float hue = a_InstanceParam2.w;

// 	vec4 worldPos;
// 	#ifdef GPU_INSTANCE
// 		worldPos = u_View * a_WorldMat * vec4(0.0, 0.0, 0.0, 1.0);
// 	#else
// 		worldPos = u_View * u_WorldMat * vec4(0.0, 0.0, 0.0, 1.0);
// 	#endif

// 	v_Texcoord0 = a_Texcoord0;
// 	v_adjHSL.x = hue; //色相
// 	v_adjHSL.y = saturation; //色度
// 	v_adjHSL.z = luminance; //亮度
//     worldPos.xy += a_Position.xy * u_Scale;
//     gl_Position = u_Projection * worldPos;
//     gl_Position = remapPositionZ(gl_Position);

// 	#ifdef FOG
//     FogHandle(gl_Position.z);
//     #endif
// }

void main() {
	float luminance = a_InstanceParam2.y;
	float saturation = a_InstanceParam2.z;
	float hue = a_InstanceParam2.w;

	#ifdef GPU_INSTANCE
		mat4 worldMat = a_WorldMat;
	#else
		mat4 worldMat = u_WorldMat;
	#endif

	vec3 offset = vec3(worldMat[3][0], worldMat[3][1], worldMat[3][2]); //从世界变换矩阵中提取位置
	vec3 cameraRight = cross(u_CameraDirection, u_CameraUp); //计算摄像机的右向量
	cameraRight = normalize(vec3(cameraRight.x, 0.0, cameraRight.z)); //摄像机的右向量垂直方向置零
	vec3 cameraUp = vec3(0.0, 1.0, 0.0); //摄像机的上向量保持垂直向上

	vec3 billPosition = (a_Position.x * cameraRight + a_Position.y * cameraUp) * u_Scale; //计算出公告版坐标
    vec4 worldPosition = vec4(billPosition + offset, 1.0); //转成世界坐标
    gl_Position = u_Projection * u_View * worldPosition; //转成屏幕坐标
	gl_Position = remapPositionZ(gl_Position);

	v_TexCoord = a_Texcoord0; //贴图坐标
	v_adjHSL.x = hue; //色相
	v_adjHSL.y = saturation; //色度
	v_adjHSL.z = luminance; //亮度

	#ifdef FOG
    FogHandle(gl_Position.z);
    #endif
}
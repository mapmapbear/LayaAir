#define SHADER_NAME TreeDepthVS

#include "Scene.glsl";
#include "Camera.glsl";
#include "VertexCommon.glsl";
#include "Sprite3DCommon.glsl";

#if defined(SHADOW) || defined(SHADOW_SPOT)
#ifdef ENUNIFORMBLOCK
uniform ShadowUniformBlock
{
    vec4 u_ShadowBias; // x: depth bias, y: normal bias
    vec3 u_ShadowLightDirection;
};
#else // ENUNIFORMBLOCK
uniform vec4 u_ShadowBias; // x: depth bias, y: normal bias
#ifdef SHADOW
uniform vec3 u_ShadowLightDirection;
#endif // SHADOW
#endif // ENUNIFORMBLOCK

vec3 applyShadowBias(vec3 positionWS, vec3 normalWS, vec3 lightDirection)
{
    float invNdotL = 1.0 - clamp(dot(-lightDirection, normalWS), 0.0, 1.0);
    float scale = invNdotL * u_ShadowBias.y;

    // normal bias is negative since we want to apply an inset normal offset
    positionWS += -lightDirection * u_ShadowBias.xxx;
    positionWS += normalWS * vec3(scale);
    return positionWS;
}

vec4 DepthPositionCS(in vec3 positionWS, in vec3 normalWS)
{
    #ifdef DEPTHPASS
    vec4 positionCS = u_ViewProjection * vec4(positionWS, 1.0);
    #endif // DEPTHPASS

    #ifdef SHADOW
    positionWS = applyShadowBias(positionWS, normalWS, u_ShadowLightDirection);
    vec4 positionCS = u_ViewProjection * vec4(positionWS, 1.0);
    positionCS.z = max(positionCS.z, 0.0); // min ndc z is 0.0
    #endif // SHADOW

    #ifdef SHADOW_SPOT
    vec4 positionCS = u_ViewProjection * vec4(positionWS, 1.0);
    positionCS.z = positionCS.z - u_ShadowBias.x / positionCS.w;
    positionCS.z = max(positionCS.z, 0.0); // min ndc z is 0.0
    #endif // SHADOW_SPOT

    return positionCS;
}
#endif

varying vec4 v_Param;
varying vec4 v_Detail;
varying vec2 v_TexCoord;

const float PI = 3.14159265359;
const float ranToDeg = 180.0 / PI;
const float degToRad = PI / 180.0;

/**
 * 从四元数和位置计算变换矩阵
 * @param trans 位置矢量
 * @param rot 旋转四元数
 */
mat4 createMatrixFromTransAndRot(vec3 trans, vec4 rot) {
    float x = rot.x;
	float y = rot.y;
	float z = rot.z;
	float w = rot.w;
    float x2 = x + x;
    float y2 = y + y;
    float z2 = z + z;
    float xx = x * x2;
    float yx = y * x2;
    float yy = y * y2;
    float zx = z * x2;
    float zy = z * y2;
    float zz = z * z2;
    float wx = w * x2;
    float wy = w * y2;
    float wz = w * z2;

    return mat4(
        1.0 - yy - zz,
        yx + wz,
        zx - wy,
        0.0,

        yx - wz,
        1.0 - xx - zz,
        zy + wx,
        0.0,

        zx + wy,
        zy - wx,
        1.0 - xx - yy,
        0.0,

        trans.x,
        trans.y,
        trans.z,
        1.0
	);
}

// 从贴图中读取矩阵数据
mat4 loadBakedMatMatrix(sampler2D tex, float kind, float sn) {
    vec2 uv;
	float size = u_ParamSize;
	float stepx = 1.0 / size;
    float pixel = kind * u_ParamStride + sn * 4.0;
    uv.y = floor(pixel / size) / size;
    uv.x = mod(pixel, size) / size;
    vec4 p1 = texture2D(tex, uv);
    uv.x += stepx;
    vec4 p2 = texture2D(tex, uv);
    return createMatrixFromTransAndRot(p1.xyz, p2);
}

//从贴图中读取风效数据
vec4 loadBakedWind(sampler2D tex, float kind, float sn) {
    vec2 uv;
	float size = u_ParamSize;
	float stepx = 1.0 / size;
    float pixel = kind * u_ParamStride + sn * 4.0;
    uv.y = floor(pixel / size) / size;
    uv.x = mod(pixel, size) / size + stepx * 2.0;
    return texture2D(tex, uv);
}

// 绕Y轴旋转
mat4 createRotationY(float rad) {
    mat4 m;
    float s = sin(rad);
	float c = cos(rad);
	m[0] = vec4(c, 0.0, -s, 0.0);
	m[1] = vec4(0.0, 1.0, 0.0, 0.0);
	m[2] = vec4(s, 0.0, c, 0.0);
	m[3] = vec4(0.0, 0.0, 0.0, 1);
	return m;
}

// 从角度生成四元数（顺序为Yaw、Pitch、Roll）
vec4 createQuaternionFromYawPitchRoll(float yaw, float pitch, float roll) {
	float halfYaw = yaw * 0.5;
    float halfRoll = roll * 0.5;
    float halfPitch = pitch * 0.5;

    float sinYaw = sin(halfYaw);
    float cosYaw = cos(halfYaw);
    float sinRoll = sin(halfRoll);
    float cosRoll = cos(halfRoll);
    float sinPitch = sin(halfPitch);
    float cosPitch = cos(halfPitch);

    vec4 q;
    q.x = (cosYaw * sinPitch * cosRoll) + (sinYaw * cosPitch * sinRoll);
    q.y = (sinYaw * cosPitch * cosRoll) - (cosYaw * sinPitch * sinRoll);
    q.z = (cosYaw * cosPitch * sinRoll) - (sinYaw * sinPitch * cosRoll);
    q.w = (cosYaw * cosPitch * cosRoll) + (sinYaw * sinPitch * sinRoll);
	return q;
}

// 从指定的轴和角度计算四元数
vec4 createFromAxisAngle(vec3 axis, float rad) {
    float s = sin(rad * 0.5);
	vec4 q;
    q.x = s * axis.x;
    q.y = s * axis.y;
    q.z = s * axis.z;
    q.w = cos(rad * 0.5);
	return q;
}

// 根据四元数旋转三维向量。
vec3 transformVectorByQuaternion(vec3 pos, vec4 q) {
    float x = pos.x;
	float y = pos.y;
	float z = pos.z;
	float qx = q.x;
	float qy = q.y;
	float qz = q.z;
	float qw = q.w;

    float ix = qw * x + qy * z - qz * y;
	float iy = qw * y + qz * x - qx * z;
	float iz = qw * z + qx * y - qy * x;
	float iw = -qx * x - qy * y - qz * z;

    vec3 p;
    p.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    p.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    p.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
	return p;
}

// 转动树叶
vec3 rotateLeaf(vec3 pos, float rx, float ry, float rz) {
	vec4 q = createQuaternionFromYawPitchRoll(rx, ry, rz);
	return transformVectorByQuaternion(pos, q);
}

void main() {
    Vertex vertex;
    getVertexParams(vertex);

	float aDist = a_Normal.x; //顶点距离系数
	float aGrow = a_Normal.y; //顶点生长系数
	float aB2T = a_Normal.z; //从底部到顶部的系数（0~1）
	float aSN = a_Color.x; //统一序号
	float aType = a_Color.y; //类型
	float aLevel = a_Color.z; //拓扑层级
	float aRand = a_Color.w; //随机值（0~1）
	float aStartX = a_Tangent0.x; //中心水平位置（用于调节树枝粗细）
	float aStartZ = a_Tangent0.y; //中心水平位置（用于调节树枝粗细）
    float aSwing = a_Tangent0.z; //摆动系数

	float kind = a_InstanceParam1.x;
	float grow = a_InstanceParam1.y;
	float dist = a_InstanceParam1.z;
	float drop = a_InstanceParam1.w;
	float hidePot = a_InstanceParam2.x;

	mat4 worldMat = a_WorldMat;
	mat4 m = loadBakedMatMatrix(u_ParamTexture, kind, aSN);

	vec4 position = a_Position;
	if (hidePot == 1.0 && aType == 1.0) //隐藏花盆（如果有）
		position.xyz *= 0.0;

	vec4 ps = vec4(aStartX, position.y, aStartZ, 1.0);
	vec4 basePos = vec4(0.0, 0.0, 0.0, 1.0);
	vec4 basePosWS = worldMat * m * basePos; //本单元起点世界坐标
	vec4 worldPosWS = worldMat * basePos; //整棵树起点的世界坐标
	vec4 positionWS = worldMat * m * ps; //起点位置世界坐标
	vec3 dp = positionWS.xyz - worldPosWS.xyz; //相对于起点的位置

	#ifdef WIND
	vec4 wind = loadBakedWind(u_ParamTexture, kind, aSN);
	float t = u_Time * u_ParamWind.y; //时间
	float wa = pow(mix(wind.x, wind.y, aB2T), wind.z); //风效系数
	float wh = (dp.x + dp.z) * wa; //水平偏移
    float intensity = min(0.25, (sin(t * 0.872 + wh) * 0.2 + 0.8) * u_ParamWind.x * 0.05); //风力调制
	float wo = (cos(t * 0.938) * 0.5 + 0.5); //偏向一边的程度
    float wr = (sin(t * 2.293) * wo - wo + 1.0) * intensity * wa; //摇摆幅度
	#endif

	//尺寸随成熟度局部变化
    if (aSN > u_BranchCodeMax) //树叶
		position.xz *= clamp((grow - aGrow) * 10.0, 0.0, 1.0);
    else { //树枝
		vec2 start = vec2(aStartX, aStartZ);
	    position.xz = (position.xz - start) * pow(min(1.0, grow), aLevel * 0.5 + 1.0) + start;
    }

    if (aType == 3.0 || aType == 4.0) { //蕨叶和鳞叶
		#ifdef WIND
		float ss = min(1.0, abs(aType - 4.0));
		float w1 = min(0.5, u_ParamWind.x * dist * 0.025);
		float w2 = w1 * aSwing;
		float rx = sin(t * 10.0 + position.y * 2.5) * w2;
		float rz = cos(t * 10.0 + position.y * 2.5) * w2;
		float ry = (rx + rz) * 0.25;
		float m1 = sin(t * 5.0 + aSN) * w1 * pow(aB2T, 3.0);
	    position.xyz = rotateLeaf(position.xyz, rx, ry, rz);
		position.y -= m1 * ss * 2.0;
		position.z += m1 * ss * 2.0;
		#endif
	}

    //世界坐标
	positionWS = worldMat * m * position;
	dp = positionWS.xyz - worldPosWS.xyz; //相对于树根的位置
    dp.y += wa * drop; //重力影响

    //尺寸随成熟度整体变化
	dp *= pow(min(1.0, grow), 0.25);

    //整体随风摇动
	#ifdef WIND
	float dir = u_ParamWind.z * degToRad; //风向弧度
	vec4 wq = createFromAxisAngle(vec3(sin(dir), 0.0, cos(dir)), wr); //转成四元数
	vec3 wp = transformVectorByQuaternion(dp, wq); //用四元数完成旋转变换
	positionWS.xyz = wp + worldPosWS.xyz; //最终世界坐标
	#endif

	v_Param.x = dist; //树木距离系数
	v_Param.y = grow; //树木生长系数
	v_Detail.x = aDist; //顶点距离系数
	v_Detail.y = aGrow; //顶点生长系数
    v_TexCoord = a_Texcoord0;

    vec3 normalWS = normalize((worldMat * m * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
    vec4 positionCS = DepthPositionCS(positionWS.xyz, normalWS);
    gl_Position = remapPositionZ(positionCS);
}
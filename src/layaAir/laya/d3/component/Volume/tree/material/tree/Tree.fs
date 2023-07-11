#define SHADER_NAME TreeLeafFS

#include "Color.glsl";
#include "Scene.glsl";
#include "Camera.glsl";
#include "SceneFog.glsl";
#include "BlinnPhongFrag.glsl";

void getPixelInfo_Tree(inout PixelInfo info, const in PixelParams pixel, const in Surface surface)
{
    info.normalWS = pixel.normalWS;
    info.positionWS = pixel.positionWS;
    info.vertexNormalWS = pixel.normalWS;
    info.viewDir = normalize(u_CameraPos - info.positionWS);

    #ifdef LIGHTMAP
	#ifdef UV1
    info.lightmapUV = pixel.uv1;
	#endif // UV1
    #endif // LIGHTMAP
}

vec3 BlinnPhongLighting_Tree(const in Surface surface, const in PixelParams pixel)
{
    PixelInfo info;
    getPixelInfo_Tree(info, pixel, surface);

    vec3 positionWS = info.positionWS;
    vec3 normalWS = info.normalWS;
    vec3 v = info.viewDir;

    vec3 lightColor = vec3(0.0, 0.0, 0.0);

    #ifdef DIRECTIONLIGHT
    for (int i = 0; i < CalculateLightCount; i++)
	{
	    if (i >= DirectionCount)
		break;
	    DirectionLight directionLight = getDirectionLight(i, positionWS);
	    if (directionLight.lightMode == LightMode_Mix)
		{
		    continue;
		}
	    Light light = getLight(directionLight);
	    lightColor += BlinnPhongLighting(surface, light, info) * light.attenuation;
	}
    #endif // DIRECTIONLIGHT

    // #if defined(POINTLIGHT) || defined(SPOTLIGHT)
    // ivec4 clusterInfo = getClusterInfo(u_View, u_Viewport, positionWS, gl_FragCoord, u_ProjectionParams);
    // #endif // POINTLIGHT || SPOTLIGHT

    // #ifdef POINTLIGHT
    // for (int i = 0; i < CalculateLightCount; i++)
	// {
	//     if (i >= clusterInfo.x)
	// 	break;
	//     PointLight pointLight = getPointLight(i, clusterInfo, positionWS);
	//     if (pointLight.lightMode == LightMode_Mix)
	// 	{
	// 	    continue;
	// 	}
	//     Light light = getLight(pointLight, normalWS, positionWS);
	//     lightColor += BlinnPhongLighting(surface, light, info) * light.attenuation;
	// }
    // #endif // POINTLIGHT

    // #ifdef SPOTLIGHT
    // for (int i = 0; i < CalculateLightCount; i++)
	// {
	//     if (i >= clusterInfo.y)
	// 	break;
	//     SpotLight spotLight = getSpotLight(i, clusterInfo, positionWS);
	//     if (spotLight.lightMode == LightMode_Mix)
	// 	{
	// 	    continue;
	// 	}
	//     Light light = getLight(spotLight, normalWS, positionWS);
	//     lightColor += BlinnPhongLighting(surface, light, info) * light.attenuation;
	// }
    // #endif // SPOTLIGHT

    vec3 giColor = BlinnPhongGI(surface, info);
    return lightColor;
}

varying float v_Type;
varying vec4 v_adjHSL;
varying vec4 v_Param;
varying vec4 v_Detail;
varying vec2 v_TexCoord;

vec3 rgb2hsl(vec3 rgb) {
    vec3 hsl = vec3(0.0);
    float r = rgb.x;
    float g = rgb.y;
    float b = rgb.z;

    float maxVal = max(max(r, g), b);
    float minVal = min(min(r, g), b);
    float a = maxVal + minVal;
    float d = maxVal - minVal;
    float ss = 0.166667;

    //Luminance
    hsl.z = a * 0.5;

    //Hue
    if (maxVal == minVal)
        hsl.x = 0.0;
    else if (maxVal == r && g >= b)
        hsl.x = ss * (g - b) / d;
    else if (maxVal == r && g < b)
        hsl.x = ss * (g - b) / d + 1.0;
    else if (maxVal == g)
        hsl.x = ss * (b - r) / d + ss * 2.0;
    else hsl.x = ss * (r - g) / d + ss * 4.0;

    //Saturation
    if (hsl.z == 0.0 || maxVal == minVal)
        hsl.y = 0.0;
    else if (hsl.z > 0.0 && hsl.z <= 0.5)
        hsl.y = d / a;
    else hsl.y = d / (2.0 - a);
    return hsl;
}

vec3 hsl2rgb(vec3 hsl) {
    vec3 rgb = vec3(0.0);
    float ss = 0.333333;

    if (hsl.y == 0.0) {
        rgb.x = hsl.z;
        rgb.y = hsl.z;
        rgb.z = hsl.z;
    }
    else {
        float q = 0.0;
        if (hsl.z < 0.5)
            q = hsl.z * (1.0 + hsl.y);
        else q = hsl.z + hsl.y - hsl.z * hsl.y;

        float p = hsl.z * 2.0 - q;
        float t[3];
        t[0] = hsl.x + ss;
        t[1] = hsl.x;
        t[2] = hsl.x - ss;

        for (int i = 0; i < 3; i++) {
            if (t[i] < 0.0) t[i] += 1.0;
            if (t[i] > 1.0) t[i] -= 1.0;

            if ((t[i] * 6.0) < 1.0)
                t[i] = p + ((q - p) * 6.0 * t[i]);
            else if ((t[i] * 2.0) < 1.0)
                t[i] = q;
            else if ((t[i] * 3.0) < 2.0)
                t[i] = p + (q - p) * (ss * 2.0 - t[i]) * 6.0;
            else t[i] = p;
        }
        rgb.x = t[0];
        rgb.y = t[1];
        rgb.z = t[2];
    }
    return rgb;
}

void getSurfaceParams(inout Surface surface, in PixelParams pixel)
{
    surface.diffuseColor = u_DiffuseColor.rgb * u_AlbedoIntensity;
    surface.alpha = u_DiffuseColor.a;

    #ifdef ALBEDO_MAP
    vec4 diffuse = texture2D(u_AlbedoTexture, v_TexCoord);
    diffuse.rgb = gammaToLinear(diffuse.rgb);
    surface.diffuseColor *= diffuse.rgb;
    surface.alpha *= diffuse.a;
    #endif

    #ifdef ALPHATEST
    if (surface.alpha < 0.5) discard;
    #endif
    if (v_Detail.y > v_Param.y) discard;

    #ifdef ENABLE_VERTEX_COLOR
    surface.diffuseColor *= pixel.vertexColor.xyz;
    surface.alpha *= pixel.vertexColor.a;
    #endif

    surface.gloss = vec3(1.0);
    surface.specularColor = u_MaterialSpecular.rgb;
    surface.shininess = u_Shininess;
}

void main()
{
	PixelParams pixel;
    getPixelParams(pixel);
    Surface surface;
    getSurfaceParams(surface, pixel);
    surface.alpha = 1.0;

	#if defined(LIGHTING)
    surface.diffuseColor = BlinnPhongLighting_Tree(surface, pixel) * 2.5;
    #endif

    //调节颜色
    if (abs(v_adjHSL.x - 0.0) > 0.005
     || abs(v_adjHSL.y - 1.0) > 0.005
     || abs(v_adjHSL.z - 1.0) > 0.005) {
        vec3 hsl = rgb2hsl(surface.diffuseColor);
        if (v_Type > 2.5 && v_Type < 5.5) //树叶
            hsl.x = clamp(hsl.x + v_adjHSL.x, 0.0, 1.0);
        hsl.y = clamp(hsl.y * v_adjHSL.y, 0.0, 1.0);
        hsl.z = clamp(hsl.z * v_adjHSL.z, 0.0, 1.0);
        surface.diffuseColor = hsl2rgb(hsl);
    }

    #ifdef VFOG
    surface.diffuseColor = addVerticalFog(surface.diffuseColor, v_PositionWS);
    #endif
	#ifdef FOG
    surface.diffuseColor = sceneLitFog(surface.diffuseColor);
    #endif

	gl_FragColor = vec4(surface.diffuseColor, surface.alpha);
}
#define SHADER_NAME TreeImposterFS

#include "Scene.glsl";
#include "SceneFog.glsl";

varying vec2 v_TexCoord;
varying vec4 v_adjHSL;

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

void main()
{
	vec4 color = u_AlbedoColor;
	#ifdef ALBEDO_MAP
		color *= texture2D(u_AlbedoTexture, v_TexCoord);
	#endif

	#ifdef ALPHATEST
		if (color.a < u_AlphaTestValue)
			discard;
	#endif

	//调整颜色
    if (abs(v_adjHSL.x - 0.0) > 0.005
     || abs(v_adjHSL.y - 1.0) > 0.005
     || abs(v_adjHSL.z - 1.0) > 0.005) {
        vec3 hsl = rgb2hsl(color.rgb);
        hsl.x = clamp(hsl.x + v_adjHSL.x, 0.0, 1.0);
        hsl.y = clamp(hsl.y * v_adjHSL.y, 0.0, 1.0);
        hsl.z = clamp(hsl.z * v_adjHSL.z, 0.0, 1.0);
        color.rgb = hsl2rgb(hsl);
    }

    #ifdef FOG
    color.rgb = sceneLitFog(color.rgb);
    #endif

	gl_FragColor = color;
}
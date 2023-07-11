#define SHADER_NAME TreeDepthFS

#include "DepthFrag.glsl";

varying vec4 v_Param;
varying vec4 v_Detail;
varying vec2 v_TexCoord;

void main()
{
    #ifdef ALBEDO_MAP
    #ifdef ALPHATEST
    vec4 diffuse = texture2D(u_AlbedoTexture, v_TexCoord);
    if (diffuse.w < 0.1) discard;
    #endif
    #endif

    #ifdef LOD
    if (v_Detail.x > v_Param.x) discard;
    #endif
    #ifdef GROW
    if (v_Detail.y > v_Param.y) discard;
    #endif

    gl_FragColor = getDepthColor();
}
#define SHADER_NAME DepthFS

#include "DepthFrag.glsl";
varying vec2 v_Texcoord0;
void main()
{
    #ifdef ALBEDOTEXTURE
        #ifdef ALPHATEST
            float alpha = texture2D(u_AlbedoTexture, v_Texcoord0).a;
            if(alpha < u_AlphaTestValue) discard;
        #endif
    #endif
    gl_FragColor = getDepthColor();
}
#version 330 core

layout (location = 0) out vec4 fragColor;

in vec2 uv_0;

uniform sampler2D u_color;
uniform sampler2D u_SSR;
uniform sampler2D u_SSI;
uniform sampler2D u_rm;
uniform sampler2D u_dm;


uniform bool use_SSR;



void main() {
    float gamma = 2.2;
    vec3 color = texture2D(u_color, uv_0).rgb;
    vec4 RM = texture2D(u_rm, uv_0);
    vec3 DM = texture2D(u_dm, uv_0).rgb;
    vec3 SSR = textureLod(u_SSR, uv_0, clamp(RM.a*8, 1, 8)).rgb;
    vec3 SSI = textureLod(u_SSI, uv_0, 5).rgb;

    if (use_SSR) {
        color += SSR * RM.rgb;
        color += SSI * DM.rgb;
    }

    
    // exposure tone mapping

    color = pow(color, 1 / vec3(gamma));
    fragColor = vec4(color, 1.0);
}











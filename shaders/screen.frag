#version 330 core

layout (location = 0) out vec4 fragColor;

in vec2 uv_0;

uniform sampler2D u_color;





void main() {
    float gamma = 2.2;
    vec3 color = texture2D(u_color, uv_0).rgb;
    fragColor = vec4(color, 1.0);
}











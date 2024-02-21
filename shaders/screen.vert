#version 460 core

layout (location = 0) in vec2 in_position;

out vec2 uv_0;

void main() {
    uv_0 = in_position.xy * 0.5 + 0.5;
    
    gl_Position = vec4(in_position.xy, 0.5, 1.0);
}
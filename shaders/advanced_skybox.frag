#version 330 core
#extension GL_NV_shadow_samplers_cube : enable

layout (location = 0) out vec3 fragColor;
layout (location = 2) out vec3 PositionOut;

in vec4 clipCoords;

uniform samplerCube u_texture_skybox;
uniform mat4 m_invProjView;


void main() {
    vec4 worldCoords = m_invProjView * clipCoords;
    vec3 texCubeCoord = normalize(worldCoords.xyz / worldCoords.w);
    fragColor = pow(textureCube(u_texture_skybox, texCubeCoord).rgb, vec3(1));
    PositionOut = vec3(0, 0, 10000);
}
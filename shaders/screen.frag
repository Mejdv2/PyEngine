#version 330 core
#extension GL_NV_shadow_samplers_cube : enable

in vec2 uv_0;
layout (location = 0) out vec4 fragColor;


struct Light {
    vec3 direction;
    vec3 color;
};


uniform sampler2D u_color;
uniform sampler2D u_norm;
uniform sampler2D u_pos;
uniform sampler2D u_shadows;
uniform sampler2D u_SSR;

uniform sampler2D u_brdfLUT;
uniform samplerCube skybox;





uniform Light light;
uniform vec3 camPos;

uniform mat4 view;


const float PI = 3.14159265359;
const vec3 gamma = vec3(2.2);






float DistributionGGX(vec3 N, vec3 H, float roughness)
{
    float a = roughness*roughness;
    float a2 = a*a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH*NdotH;

    float nom   = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return nom / denom;
}

float GeometrySchlickGGX(float NdotV, float roughness)
{
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0;

    float nom   = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
{
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}



vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness)
{
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
} 




vec3 CalcLight(vec3 albedo, vec4 arms, vec3 Normal, vec3 fragPos, vec3 camiPos)
{		
    vec3 N = normalize(Normal);
    vec3 V = normalize(camiPos - fragPos);
   
    vec3 F0 = vec3(0.04); 
    F0 = mix(F0, albedo, arms.b);

    // calculate per-light radiance
    vec3 L = normalize(-light.direction);
    vec3 H = normalize(V + L);
    vec3 radiance = light.color;

    // Cook-Torrance BRDF
    float NDF = DistributionGGX(N, H, arms.g);   
    float G   = GeometrySmith(N, V, L, arms.g);      
    vec3 F    = fresnelSchlick(clamp(dot(H, V), 0.0, 1.0), F0);
        
    float cosTheta = max(dot(N, V), 0.0);
    float NdotL = dot(N, L);

    vec3 numerator    = NDF * G * F; 
    float denominator = 4.0 * cosTheta * max(NdotL, 0.0) + 0.0001; // + 0.0001 to prevent divide by zero
    vec3 specular = numerator / denominator;
    
    // kS is equal to Fresnel
    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - arms.b;

    // add to outgoing radiance Lo
    vec3 Lo = (kD * albedo / PI + specular) * radiance * NdotL;  // note that we already multiplied the BRDF by the Fresnel (kS) so we won't multiply by kS again


    
    // ambient lighting (note that the next IBL tutorial will replace 
    // this ambient lighting with environment lighting).

    return vec3(max(Lo * arms.a, vec3(0)));
}


vec3 reflection_Calc(vec3 albedo, vec3 arm, vec3 Normal, vec3 fragPos, vec3 camiPos){
    vec3 N = normalize(Normal);
    vec3 V = normalize(camiPos - fragPos);

    vec3 F0 = vec3(0.04); 
    F0 = mix(F0, albedo, arm.b);
    float cosTheta = max(dot(N, V), 0.0);

    vec3 FR = fresnelSchlickRoughness(cosTheta, F0, arm.g);

    vec2 brdfL  = texture2D(u_brdfLUT, vec2(cosTheta, arm.g)).rg;
    return vec3((FR * brdfL.x + brdfL.y) * arm.r);
}




void main() {
    // Allocating and Fetching Data

    vec3 color   = texture2D(u_color,   uv_0).rgb;
    vec3 norm    = texture2D(u_norm,    uv_0).rgb;
    vec3 pos     = texture2D(u_pos,     uv_0).rgb;
    vec3 shadow  = texture2D(u_shadows, uv_0).rgb;
    vec3 ssr_uv  = texture2D(u_SSR,     uv_0).rgb;

    vec3 ssr_color;
    vec3 ssr_cube_color;
    vec3 ssr_norm;
    vec3 ssr_pos;
    vec3 ssr_shadow;

    vec3 arm    = vec3(1, 0.05, 1);
    vec3 ss_arm;
    
    if (ssr_uv.z > 0.9) {
        ssr_color  = textureLod(u_color,  ssr_uv.xy, arm.g*8).rgb;
        ssr_norm   = texture2D(u_norm,    ssr_uv.xy).rgb;
        ssr_pos    = texture2D(u_pos,     ssr_uv.xy).rgb;
        ssr_shadow = texture2D(u_shadows, ssr_uv.xy).rgb;

        ss_arm     = vec3(1, 0.05, 1);
        
        vec3 reflectDir = reflect(-normalize(pos - ssr_pos), ssr_norm);
        ssr_cube_color  = textureLod(skybox, reflectDir, ss_arm.g*64).rgb;

    }  else  {
        vec3 reflectDir = reflect(-normalize(camPos - pos), norm);
        ssr_color  = textureLod(skybox, reflectDir, arm.g*64).rgb;
    }

    // Now The Real Shading >:D

    if (norm == vec3(0)) {
        fragColor = vec4(color, 1.0); // if the normal vector isn't defined (Like skybox), lighting is skipped

    } else {
        color     = pow(color, vec3(gamma));
        ssr_color = pow(ssr_color, vec3(gamma));

        vec3 outColor = CalcLight(color, vec4(arm, shadow.r), norm, pos, camPos);
        
        if (ssr_norm != vec3(0)) {
            ssr_cube_color = pow(ssr_cube_color, vec3(gamma));

            outColor += reflection_Calc(color, vec3(arm), norm, pos, camPos) * 
                        CalcLight(ssr_color, vec4(ss_arm, ssr_shadow.r), ssr_norm, ssr_pos, pos);

            outColor += reflection_Calc(color, vec3(arm), norm, pos, camPos) * 
                        reflection_Calc(ssr_color, vec3(ss_arm), ssr_norm, ssr_pos, pos) * ssr_cube_color;

        } else {
            outColor += reflection_Calc(color, vec3(arm), norm, pos, camPos) * ssr_color;
        }

        outColor  = pow(outColor, vec3(1/gamma));

        fragColor = vec4(outColor, 1.0);
    }
}
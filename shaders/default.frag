#version 460 core

layout (location = 0) out vec3 fragColor;
layout (location = 1) out vec3 NormalOut;
layout (location = 2) out vec3 PositionOut;
layout (location = 3) out vec3 shadowOut;

in vec2 uv_0;
in vec3 normal;
in vec3 fragPos;
in vec4 shadowCoord;

uniform sampler2D u_texture_0;

uniform sampler2DShadow shadowMap;
uniform vec2 u_resolution;


float lookup(float ox, float oy) {
    vec2 pixelOffset = 1 / u_resolution;
    return textureProj(shadowMap, shadowCoord + vec4(ox * pixelOffset.x * shadowCoord.w,
                                                     oy * pixelOffset.y * shadowCoord.w, 0.0, 0.0));
}


float getSoftShadowX4() {
    float shadow;
    float swidth = 1.5;  // shadow spread
    vec2 offset = mod(floor(gl_FragCoord.xy), 2.0) * swidth;
    shadow += lookup(-1.5 * swidth + offset.x, 1.5 * swidth - offset.y);
    shadow += lookup(-1.5 * swidth + offset.x, -0.5 * swidth - offset.y);
    shadow += lookup( 0.5 * swidth + offset.x, 1.5 * swidth - offset.y);
    shadow += lookup( 0.5 * swidth + offset.x, -0.5 * swidth - offset.y);
    return shadow / 4.0;
}



float getSoftShadowX16() {
    float shadow;
    float swidth = 1.0;
    float endp = swidth * 1.5;
    for (float y = -endp; y <= endp; y += swidth) {
        for (float x = -endp; x <= endp; x += swidth) {
            shadow += lookup(x, y);
        }
    }
    return shadow / 16.0;
}


float getSoftShadowX64() {
    float shadow;
    float swidth = 0.6;
    float endp = swidth * 3.0 + swidth / 2.0;
    for (float y = -endp; y <= endp; y += swidth) {
        for (float x = -endp; x <= endp; x += swidth) {
            shadow += lookup(x, y);
        }
    }
    return shadow / 64;
}


float getShadow() {
    float shadow = textureProj(shadowMap, shadowCoord);
    return shadow;
}

/*

struct Light {
    vec3 direction;
    vec3 color;
};

uniform Light light;
uniform vec3 camPos;

uniform sampler2D u_texture_1;
uniform sampler2D u_brdfLUT;



vec3 getLight(vec3 color) {
    vec3 Normal = normalize(normal);

    // ambient light
    vec3 ambient = light.Ia;

    // diffuse light
    vec3 lightDir = normalize(-light.direction);
    float diff = max(0, dot(lightDir, Normal));
    vec3 diffuse = diff * light.Id;

    // specular light
    vec3 viewDir = normalize(camPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, Normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0), 32);
    vec3 specular = spec * light.Is;

    // shadow
//    float shadow = getShadow();
    float shadow = getSoftShadowX16();

    return color * (ambient + (diffuse + specular) * shadow);
}
*/

/*
const float PI = 3.14159265359;
// ----------------------------------------------------------------------------
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
// ----------------------------------------------------------------------------
float GeometrySchlickGGX(float NdotV, float roughness)
{
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0;

    float nom   = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}
// ----------------------------------------------------------------------------
float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
{
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}
// ----------------------------------------------------------------------------
vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}
// ----------------------------------------------------------------------------
vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness)
{
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
} 
// ----------------------------------------------------------------------------
vec3 CalcLight(vec3 albedo, vec4 arms, vec3 Normal, float shadow)
{		
    vec3 N = normalize(Normal);
    vec3 V = normalize(camPos - fragPos);
   
    vec3 F0 = vec3(arms.a); 
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

    return vec3(max(Lo * shadow, vec3(0)));
}


vec3 reflection_Calc(vec3 albedo, vec4 arms, vec3 Normal){
    vec3 N = normalize(Normal);
    vec3 V = normalize(camPos - fragPos);

    vec3 F0 = vec3(0.04); 
    F0 = mix(F0, albedo, arms.b);
    float cosTheta = max(dot(N, V), 0.0);

    vec3 FR = fresnelSchlickRoughness(cosTheta, F0, arms.g);

    vec2 brdfL  = texture2D(u_brdfLUT, vec2(cosTheta, arms.g)).rg;
    return vec3((FR * brdfL.x + brdfL.y) * arms.r);
}

vec3 diffuse_Calc(vec3 albedo, vec4 arms, vec3 Normal){
    vec3 N = normalize(Normal);
    vec3 V = normalize(camPos - fragPos);

    vec3 F0 = vec3(0.04); 
    F0 = mix(F0, albedo, arms.b);
    float cosTheta = max(dot(N, V), 0.0);

    vec3 FR = fresnelSchlickRoughness(cosTheta, F0, arms.g);

    vec3 kD = 1.0 - FR;
    kD *= 1.0 - arms.b;	  
    
    return vec3(kD * albedo);
}
*/


void main() {
    float gamma = 2.2;
    vec3 color  = texture2D(u_texture_0, uv_0).rgb;

    fragColor   = vec3(color);
    NormalOut   = vec3(normalize(normal));
    PositionOut = vec3(fragPos);
    shadowOut   = vec3(getSoftShadowX16(), 0, 0);
}











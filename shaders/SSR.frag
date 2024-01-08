#version 330 core
#extension GL_NV_shadow_samplers_cube : enable

uniform sampler2D gfi;
uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform samplerCube envMap;

uniform mat4 invView;
uniform mat4 projection;
uniform mat4 invprojection;

in vec2 uv_0;

out vec3 outColor;

const float stepX = 3;
const float minRayStep = 0.1;
const float maxSteps = 15;
const int numBinarySearchSteps = 5;
const float reflectionSpecularFalloffExponent = 3.0;

const float far = 1000;
const float near = 0.1;


#define Scale vec3(.8, .8, .8)
#define K 19.19

vec3 PositionFromDepth(float depth);

vec3 BinarySearch(inout vec3 dir, inout vec3 hitCoord, inout float dDepth);
 
vec4 RayCast(vec3 dir, inout vec3 hitCoord, out float dDepth);

void main()
{

    vec2 MetallicEmmissive = vec2(0, 0);
	bool tfon = texture2D(gPosition, uv_0.xy).z < 9999;
	vec3 SSR = vec3(0);

	if (tfon) {
		vec3 viewNormal = vec3(texture2D(gNormal, uv_0) * invView);
		vec3 viewPos = texture2D(gPosition, uv_0).xyz;
		vec3 albedo = texture2D(gfi, uv_0).rgb;


		// Reflection vector
		vec3 reflected = normalize(reflect(normalize(viewPos), normalize(viewNormal)));


		vec3 hitPos = viewPos;
		float dDepth;
	
		vec3 wp = vec3(vec4(viewPos, 1.0) * invView);
		vec4 coords = RayCast(reflected * max(minRayStep, -viewPos.z), hitPos, dDepth);
	
	
		vec2 dCoords = smoothstep(0.2, 0.6, abs(vec2(0.5, 0.5) - coords.xy));
	
	
		float screenEdgefactor = 1;

		float ReflectionMultiplier =
					screenEdgefactor * 
					-reflected.z;
	
		// Get color
		if (coords.x > 0.001 && coords.y > 0.001 && coords.x < 0.999 && coords.y < 0.999 &&
            coords.z < 0 && (dDepth < stepX || dDepth > 900) ) {
			SSR = (texture2D(gfi, coords.xy).rgb).rgb; 
		} else {
            SSR = textureCube(envMap, vec3(reflected * inverse(mat3(invView)))).rgb;
            SSR = pow(SSR, vec3(2.2));
        }
	}

    outColor = vec3(SSR);
}

vec3 PositionFromDepth(float depth) {
    float z = depth * 2.0 - 1.0;

    vec4 clipSpacePosition = vec4(uv_0 * 2.0 - 1.0, z, 1.0);
    vec4 viewSpacePosition = invprojection * clipSpacePosition;

    // Perspective division
    viewSpacePosition /= viewSpacePosition.w;

    return viewSpacePosition.xyz;
}

vec3 BinarySearch(inout vec3 dir, inout vec3 hitCoord, inout float dDepth)
{
    float depth;

    vec4 projectedCoord;
 
    for(int i = 0; i < numBinarySearchSteps; i++)
    {

        projectedCoord = projection * vec4(hitCoord, 1.0);
        projectedCoord.xy /= projectedCoord.w;
        projectedCoord.xy = projectedCoord.xy * 0.5 + 0.5;
 
        depth = texture2D(gPosition, projectedCoord.xy).z;

 
        dDepth = hitCoord.z - depth;

        dir *= 0.5;
        if(dDepth > 0.0)
            hitCoord += dir;
        else
            hitCoord -= dir;    
    }

        projectedCoord = projection * vec4(hitCoord, 1.0);
        projectedCoord.xy /= projectedCoord.w;
        projectedCoord.xy = projectedCoord.xy * 0.5 + 0.5;
 
    return vec3(projectedCoord.xy, depth);
}

vec4 RayCast(vec3 dir, inout vec3 hitCoord, out float dDepth)
{

    dir *= stepX;
 
 
    float depth;
    int steps;
    vec4 projectedCoord;

 
    for(int i = 0; i < maxSteps; i++)
    {
        hitCoord += dir;
 
        projectedCoord = projection * vec4(hitCoord, 1.0);
        projectedCoord.xy /= projectedCoord.w;
        projectedCoord.xy = projectedCoord.xy * 0.5 + 0.5;
 
        depth = texture2D(gPosition, projectedCoord.xy).z;
        if(depth > 1000.0)
            continue;
 
        dDepth = hitCoord.z - depth;

        if((dir.z - dDepth) < 1.2)
        {
            if(dDepth <= 0.0)
            {   
                vec4 Result;
                Result = vec4(BinarySearch(dir, hitCoord, dDepth), 1.0);

                return Result;
            }
        }
        
        steps++;
    }

    
    return vec4(projectedCoord.xy, depth, 0.0);
}
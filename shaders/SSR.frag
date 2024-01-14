#version 330 core
#extension GL_NV_shadow_samplers_cube : enable

uniform sampler2D gfi;
uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform samplerCube envMap;

uniform mat4 invView;
uniform mat4 view;
uniform mat4 projection;
uniform mat4 invProjection;

in vec2 uv_0;

layout (location = 0) out vec3 uvPos;

const float stepX = 1;
const float minRayStep = 0.1;
const float maxSteps = 25;
const int numBinarySearchSteps = 10;
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

    vec3 pos = texture2D(gPosition, uv_0).xyz;
    vec3 norm = normalize(texture2D(gNormal, uv_0).xyz);

    vec3 viewNormal = normalize(vec3(vec4(norm, 1) * invView));
    vec3 viewPos = vec3(view * vec4(pos, 1));

    // Reflection vector
    vec3 reflected = normalize(reflect(normalize(viewPos), viewNormal));
	vec3 UV  = vec3(0);

	if (norm != vec3(0)) {
        vec3 hitPos = viewPos;
		float dDepth;
	
		vec4 coords = RayCast(reflected * max(minRayStep, -viewPos.z), hitPos, dDepth);		
	

		// Get color
		if (coords.x > 0.001 && coords.y > 0.001 && coords.x < 0.999 && coords.y < 0.999 &&
            coords.z < 0 && (dDepth < stepX || dDepth > far) && coords.w > 0.9) {
			UV = vec3(coords.xy, 1); 
        }
        uvPos = UV;
    }
}

vec3 PositionFromDepth(float depth) {
    float z = depth * 2.0 - 1.0;

    vec4 clipSpacePosition = vec4(uv_0 * 2.0 - 1.0, z, 1.0);
    vec4 viewSpacePosition = invProjection * clipSpacePosition;

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
            if(dDepth < stepX && dDepth > -stepX)
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
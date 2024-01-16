import glm


class Light:
    def __init__(self, position=(50, 50, -10), color=(1, 1, 1)):
        self.position = glm.vec3(position)
        self.color = glm.vec3(color)
        self.direction = glm.vec3(0, 0, 0)
        # intensities
        self.Ia = 0.06 * self.color  # ambient
        self.Id = 0.8 * self.color  # diffuse
        self.Is = 1.0 * self.color  # specular
        # shadow matricies
        self.m_proj_light = self.get_proj_matrix()
        self.m_view_light = self.get_view_matrix()
        self.RESOLUTION = glm.ivec2(512, 512)
        self.ppsm = glm.ivec2(4, 4)

    def get_view_matrix(self):
        return glm.lookAt(self.position, self.direction, glm.vec3(0, 1, 0))
    
    
    def get_proj_matrix(self):
        return glm.ortho(-64, 64, 64, -64, 0, 1000)
    
    

class DirectionalLight:
    def __init__(self, app, direction=(0, -90, 0), color=(1, 1, 1)):
        self.app = app
        self.position = glm.vec3(0)
        self.color = glm.vec3(color)
        self.direction = glm.vec3(direction)
        self.forward = glm.vec3(0)
        # intensities
        # shadow matricies
        self.m_proj_light = self.get_proj_matrix()
        self.m_view_light = self.get_view_matrix()
        self.RESOLUTION = glm.ivec2(400)
        self.ppsm = glm.ivec2(16)
        self.update_camera_vectors()


    def update_camera_vectors(self):
        yaw, pitch = glm.radians(self.direction.x), glm.radians(self.direction.y)

        self.forward.x = glm.cos(yaw) * glm.cos(pitch)
        self.forward.y = glm.sin(pitch)
        self.forward.z = glm.sin(yaw) * glm.cos(pitch)

        self.forward = glm.normalize(self.forward)
        self.right = glm.normalize(glm.cross(self.forward, glm.vec3(0, 1, 0)))
        self.up = glm.normalize(glm.cross(self.right, self.forward))
        


    def get_view_matrix(self):
        self.update_camera_vectors()
        return glm.lookAt(-self.forward * 2, glm.vec3(0, 0, 0), self.up)
    
    
    def get_proj_matrix(self):
        return glm.ortho(-200, 200, 200, -200, 0, 1000)
    
    
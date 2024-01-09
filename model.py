import moderngl as mgl
import numpy as np
import glm


class BaseModel:
    def __init__(self, app, vao_name, tex_id, pos=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
        self.app = app
        self.pos = pos
        self.vao_name = vao_name
        self.rot = glm.vec3([glm.radians(a) for a in rot])
        self.scale = scale
        self.m_model = self.get_model_matrix()
        self.tex_id = tex_id
        self.vao = app.mesh.vao.vaos[vao_name]
        self.program = self.vao.program
        self.camera = self.app.camera

    def update(self): ...

    def get_model_matrix(self):
        m_model = glm.mat4()
        # translate
        m_model = glm.translate(m_model, self.pos)
        # rotate
        m_model = glm.rotate(m_model, self.rot.z, glm.vec3(0, 0, 1))
        m_model = glm.rotate(m_model, self.rot.y, glm.vec3(0, 1, 0))
        m_model = glm.rotate(m_model, self.rot.x, glm.vec3(1, 0, 0))
        # scale
        m_model = glm.scale(m_model, self.scale)
        return m_model

    def render(self):
        self.update()
        self.vao.render()


class ExtendedBaseModel(BaseModel):
    def __init__(self, app, vao_name, tex_id, pos, rot, scale):
        super().__init__(app, vao_name, tex_id, pos, rot, scale)
        self.on_init()

    def update(self):
        self.program['camPos'].write(self.camera.position)

        self.program['m_proj'].write(self.camera.m_proj)
        self.program['m_view'].write(self.camera.m_view)
        self.program['m_model'].write(self.m_model)
        
        # texture
        self.texture = self.app.mesh.texture.textures[self.tex_id]
        self.program['u_texture_0'] = 0
        self.texture.use(location=0)
        # texture
        self.texture = self.app.mesh.texture.textures['rough']
        self.program['u_texture_1'] = 1
        self.texture.use(location=1)


        self.program['u_brdfLUT'] = 9
        self.brdfLUT.use(location=9)

        self.program['shadowMap'] = 10
        self.depth_texture.use(location=10)
        
        self.depth_texture = self.app.mesh.texture.textures['depth_texture']
        

    def update_shadow(self):
        self.shadow_program['m_model'].write(self.m_model)

    def render_shadow(self):
        self.update_shadow()
        self.shadow_vao.render()

    def on_init(self):
        self.program['m_proj_light'].write(self.app.light.m_proj_light)
        self.program['m_view_light'].write(self.app.light.m_view_light)
        # resolution
        self.program['u_resolution'].write(glm.vec2(self.app.light.RESOLUTION*self.app.light.ppsm))
        # depth texture
        self.depth_texture = self.app.mesh.texture.textures['depth_texture']
        self.program['shadowMap'] = 10
        self.depth_texture.use(location=10)
        # shadow
        self.shadow_vao = self.app.mesh.vao.vaos['shadow_' + self.vao_name]
        self.shadow_program = self.shadow_vao.program
        self.shadow_program['m_proj_light'].write(self.app.light.m_proj_light)
        self.shadow_program['m_view_light'].write(self.app.light.m_view_light)
        self.shadow_program['m_model'].write(self.m_model)
        # texture
        self.texture = self.app.mesh.texture.textures[self.tex_id]
        self.program['u_texture_0'] = 0
        self.texture.use(location=0)
        # texture
        self.texture = self.app.mesh.texture.textures['rough']
        self.program['u_texture_1'] = 1
        self.texture.use(location=1)
        # brdf
        self.brdfLUT = self.app.mesh.texture.textures['brdfLUT']
        self.program['u_brdfLUT'] = 9
        self.brdfLUT.use(location=9)
        # mvp
        self.program['m_proj'].write(self.camera.m_proj)
        self.program['m_view'].write(self.camera.m_view)
        self.program['m_model'].write(self.m_model)
        # light
        self.program['light.direction'].write(self.app.light.direction)
        self.program['light.color'].write(self.app.light.color)




class Screen:
    def __init__(self, app):
        self.app = app
        self.vao_name = 'screen'
        self.vao:mgl.VertexArray = app.mesh.vao.vaos['screen']
        self.program = self.vao.program

        self.vao_name_SSR = 'SSR'
        self.vao_SSR:mgl.VertexArray = app.mesh.vao.vaos['SSR']
        self.program_SSR = self.vao_SSR.program

    def update(self): ...

    def render_SSR(self, frame:mgl.Texture, norm:mgl.Texture, pos:mgl.Texture):
        self.update()
        self.program_SSR['gNormal'] = 2
        self.program_SSR['gPosition'] = 3
        self.program_SSR['gfi'] = 1
        frame.use(location=1)
        norm.use(location=2)
        pos.use(location=3)
        
        mv = self.app.camera.m_view
        mp = self.app.camera.m_proj
        
        self.program_SSR['projection'].write(mp)
        self.program_SSR['invView'].write(glm.inverse(mv))
        


        self.vao_SSR.render()

        

    def render(self, frame:mgl.Texture, SSR:mgl.Texture, SSI:mgl.Texture, RM:mgl.Texture, DM:mgl.Texture, use_SSR):
        self.program['u_color'] = 1
        self.program['u_SSR'] = 2
        self.program['u_SSI'] = 3
        self.program['u_rm'] = 4
        self.program['u_dm'] = 5
        self.program['use_SSR'].write(glm.bool_(use_SSR))

        frame.use(location=1)
        SSR.use(location=2)
        SSI.use(location=3)
        RM.use(location=4)
        SSI.use(location=5)


        self.vao.render()




class Cube(ExtendedBaseModel):
    def __init__(self, app, vao_name='cube', tex_id='floor',
                 pos=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
        super().__init__(app, vao_name, tex_id, pos, rot, scale)

        
class Sphere(ExtendedBaseModel):
    def __init__(self, app, vao_name='obj', tex_id='floor',
                 pos=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
        super().__init__(app, vao_name, tex_id, pos, rot, scale)


class AdvancedSkyBox(BaseModel):
    def __init__(self, app, vao_name='advanced_skybox', tex_id='skybox',
                 pos=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
        super().__init__(app, vao_name, tex_id, pos, rot, scale)
        self.on_init()

    def update(self):
        m_view = glm.mat4(glm.mat3(self.camera.m_view))
        self.program['m_invProjView'].write(glm.inverse(self.camera.m_proj * m_view))

    def on_init(self):
        # texture
        self.texture = self.app.mesh.texture.textures[self.tex_id]
        self.program['u_texture_skybox'] = 0
        self.texture.use(location=0)




















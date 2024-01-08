import moderngl as mgl

SSR = True
class SceneRenderer:
    def __init__(self, app):
        self.app = app
        self.ctx:mgl.Context = app.ctx
        self.mesh = app.mesh
        self.scene = app.scene
        # depth buffer
        self.depth_texture = self.mesh.texture.textures['depth_texture']

        self.drt_texture:mgl.Texture = self.mesh.texture.get_depth_texture(app.WIN_SIZE)
        self.crt_texture:mgl.Texture = self.mesh.texture.get_render_texture(app.WIN_SIZE)
        self.nrm_texture:mgl.Texture = self.mesh.texture.get_render_texture(app.WIN_SIZE)
        self.pos_texture:mgl.Texture = self.mesh.texture.get_render_texture(app.WIN_SIZE)
        self.rfm_texture:mgl.Texture = self.mesh.texture.get_render_texture(app.WIN_SIZE)
        self.SSRO:mgl.Texture        = self.mesh.texture.get_render_texture(app.WIN_SIZE)

        self.depth_fbo       = self.ctx.framebuffer(depth_attachment=self.depth_texture)
        self.render_fbo      = self.ctx.framebuffer(depth_attachment=self.drt_texture, color_attachments=[self.crt_texture, self.nrm_texture, 
                                                                                                          self.pos_texture, self.rfm_texture])
        self.render_fbo_ssrc = self.ctx.framebuffer(color_attachments=[self.SSRO])

    def render_shadow(self):
        self.depth_fbo.clear()
        self.depth_fbo.use()
        for obj in self.scene.objects:
            obj.render_shadow()

    def main_render(self):
        self.render_fbo.clear()
        self.render_fbo.use()
        for obj in self.scene.objects:
            obj.render()
        self.scene.skybox.render()

        
    def process_render(self):
        if (SSR):
            self.render_fbo_ssrc.clear()
            self.render_fbo_ssrc.use()
            self.scene.screen.render_SSR(self.crt_texture, self.nrm_texture, self.pos_texture)
            self.SSRO.filter = (mgl.LINEAR_MIPMAP_LINEAR, mgl.LINEAR)
            self.SSRO.build_mipmaps(0, 8)

        self.ctx.screen.use()
        self.scene.screen.render(self.crt_texture, self.SSRO, self.rfm_texture, SSR)

    def render(self):
        self.scene.update()
        # pass 1
        self.render_shadow()
        # pass 2
        self.main_render()

        self.process_render()

    def resize(self):
        self.render_fbo.release()
        self.render_fbo_ssrc.release()
        self.drt_texture.release()
        self.crt_texture.release()
        self.nrm_texture.release()
        self.pos_texture.release()
        self.rfm_texture.release()
        self.SSRO.release()

        self.drt_texture:mgl.Texture = self.mesh.texture.get_depth_texture(self.app.WIN_SIZE)
        self.crt_texture:mgl.Texture = self.mesh.texture.get_render_texture(self.app.WIN_SIZE)
        self.nrm_texture:mgl.Texture = self.mesh.texture.get_render_texture(self.app.WIN_SIZE)
        self.pos_texture:mgl.Texture = self.mesh.texture.get_render_texture(self.app.WIN_SIZE)
        self.rfm_texture:mgl.Texture = self.mesh.texture.get_render_texture(self.app.WIN_SIZE)
        self.SSRO:mgl.Texture        = self.mesh.texture.get_render_texture(self.app.WIN_SIZE)

        self.render_fbo = self.ctx.framebuffer(depth_attachment=self.drt_texture, color_attachments=[self.crt_texture, self.nrm_texture, 
                                                                                                     self.pos_texture, self.rfm_texture])
        self.render_fbo_ssrc = self.ctx.framebuffer(color_attachments=[self.SSRO])


    def destroy(self):
        self.depth_fbo.release()
        self.render_fbo.release()
        self.drt_texture.release()
        self.crt_texture.release()


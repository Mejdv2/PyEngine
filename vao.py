from vbo import VBO
from shader_program import ShaderProgram
import moderngl as mgl

class VAO:
    def __init__(self, ctx):
        self.ctx:mgl.Context = ctx
        self.vbo = VBO(ctx)
        self.program = ShaderProgram(ctx)
        self.vaos = {}


        # cube vao
        self.vaos['screen'] = self.get_vao(
            program=self.program.programs['screen'],
            vbo = self.vbo.vbos['screen'])
        

        # SSR vao
        self.vaos['SSR'] = self.get_vao(
            program=self.program.programs['SSR'],
            vbo = self.vbo.vbos['screen'])
        

        # cube vao
        self.vaos['cube'] = self.get_vao(
            program=self.program.programs['default'],
            vbo = self.vbo.vbos['cube'])

        # shadow cube vao
        self.vaos['shadow_cube'] = self.get_vao(
            program=self.program.programs['shadow_map'],
            vbo = self.vbo.vbos['cube'])

        # obj vao
        self.vaos['obj'] = self.get_vao(
            program=self.program.programs['default'],
            vbo=self.vbo.vbos['obj'])

        # shadow obj vao
        self.vaos['shadow_obj'] = self.get_vao(
            program=self.program.programs['shadow_map'],
            vbo=self.vbo.vbos['obj'])

        # obj vao
        self.vaos['Iobj'] = self.get_vao(
            program=self.program.programs['default'],
            vbo=self.vbo.vbos['Icube'])

        # shadow obj vao
        self.vaos['shadow_Iobj'] = self.get_vao(
            program=self.program.programs['shadow_map'],
            vbo=self.vbo.vbos['Icube'])

        # advanced_skybox vao
        self.vaos['advanced_skybox'] = self.get_vao(
            program=self.program.programs['advanced_skybox'],
            vbo=self.vbo.vbos['advanced_skybox'])

    def get_vao(self, program, vbo):
        vao = self.ctx.vertex_array(program, [(vbo.vbo, vbo.format, *vbo.attribs)])
        return vao

    def destroy(self):
        self.vbo.destroy()
        self.program.destroy()
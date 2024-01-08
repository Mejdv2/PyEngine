import moderngl as mgl

class ShaderProgram:
    def __init__(self, ctx):
        self.ctx:mgl.Context = ctx
        self.programs = {}
        self.programs['screen'] = self.get_program('screen')
        self.programs['default'] = self.get_program('default')
        self.programs['SSR'] = self.get_program('SSR')
        self.programs['advanced_skybox'] = self.get_program('advanced_skybox')
        self.programs['shadow_map'] = self.get_program('shadow_map')

    def get_program(self, shader_program_name):
        with open(f'shaders/{shader_program_name}.vert') as file:
            vertex_shader = file.read()

        with open(f'shaders/{shader_program_name}.frag') as file:
            fragment_shader = file.read()

        program = self.ctx.program(vertex_shader=vertex_shader, fragment_shader=fragment_shader)
        return program

    def destroy(self):
        [program.release() for program in self.programs.values()]

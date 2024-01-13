import pygame as pg
import moderngl as mgl
import sys
from model import *
from camera import Camera
from light import *
from mesh import Mesh
from scene import Scene
from scene_renderer import SceneRenderer
import time

class GraphicsEngine:
    def __init__(self, win_size=glm.ivec2(800, 450)):
        # init pygame modules
        pg.init()
        # window size
        self.WIN_SIZE = win_size
        # set opengl attr
        pg.display.gl_set_attribute(pg.GL_CONTEXT_MAJOR_VERSION, 3)
        pg.display.gl_set_attribute(pg.GL_CONTEXT_MINOR_VERSION, 3)
        pg.display.gl_set_attribute(pg.GL_CONTEXT_PROFILE_MASK, pg.GL_CONTEXT_PROFILE_CORE)
        # create opengl context
        pg.display.set_mode(self.WIN_SIZE, flags=pg.OPENGL | pg.DOUBLEBUF | pg.RESIZABLE)
        # mouse settingsw
        # detect and use existing opengl context
        self.ctx = mgl.create_context()
        # self.ctx.front_face = 'cw'
        self.ctx.enable(flags=mgl.DEPTH_TEST | mgl.CULL_FACE)
        # create an object to help track time
        self.clock = pg.time.Clock()
        self.time = time.time()
        self.delta_time = 1
        # camera
        self.camera = Camera(self)
        # light
        self.light = DirectionalLight(self, (-45, -45, 0))
        # mesh
        self.mesh = Mesh(self)
        # scene
        self.scene = Scene(self)
        # renderer
        self.scene_renderer = SceneRenderer(self)

    def check_events(self):
        for event in pg.event.get():
            if event.type == pg.QUIT or (event.type == pg.KEYDOWN and event.key == pg.K_ESCAPE):
                self.mesh.destroy()
                self.scene_renderer.destroy()
                pg.quit()
                sys.exit()

            if event.type == pg.WINDOWSIZECHANGED:
                self.ctx.viewport = (0, 0, event.x, event.y)
                self.WIN_SIZE = glm.ivec2(event.x, event.y)
                self.scene_renderer.resize()
                self.camera.resize()

    def render(self):
        # clear framebuffer
        self.ctx.clear(color=(0.0, 0.0, 0.0))
        # render scene
        self.scene_renderer.render()
        # swap buffers
        pg.display.flip()

    def get_time(self):
        self.time = time.time()

    def run(self):
        while True:
            self.delta_time = time.time() - self.time
            self.get_time()
            self.camera.update()
            self.check_events()
            self.render()
            try:
                print(1/self.delta_time)
            except:
                print("INF")


if __name__ == '__main__':
    app = GraphicsEngine()
    app.run()































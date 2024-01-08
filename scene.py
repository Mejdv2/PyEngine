from model import *
import glm


class Scene:
    def __init__(self, app):
        self.app = app
        self.objects = []
        self.load()
        # skybox
        self.skybox = AdvancedSkyBox(app)
        self.screen = Screen(app)

    def add_object(self, obj):
        self.objects.append(obj)

    def load(self):
        app = self.app
        add = self.add_object

        # cat
        add(Cube(app, pos=(0, 0, -10), scale=(5, 5, 5)))
        add(Cube(app, pos=(6, 0, -16), scale=(1, 5, 1)))

    def update(self):
        pass

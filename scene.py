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
        add(Cube(app, pos=(0, 0, -10), scale=(5, 1, 5)))
        add(Cube(app, pos=(0, 5, -10), scale=(1, 1, 1), tex_id='diff'))

    def update(self):
        pass

class SceneOld:
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
        add(Cube(app, pos=(6, 0, -4), scale=(1, 5, 1)))

    def update(self):
        pass



class SceneOldRT:
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
        add(Cube(app, pos=(0,  0, -10), scale=(5, 1, 5)))

        add(Cube(app, pos=(-5, 0, -10), scale=(1, 3, 5), tex_id='diff'))
        add(Cube(app, pos=(5,  0, -10), scale=(1, 3, 5), tex_id='diff'))
        add(Cube(app, pos=(0,  0, -5),  scale=(5, 3, 1), tex_id='diff'))
        add(Cube(app, pos=(0,  0, -15), scale=(5, 3, 1), tex_id='diff'))

    def update(self):
        pass
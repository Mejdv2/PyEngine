import pygame as pg
import moderngl as mgl
import glm


class Texture:
    def __init__(self, app):
        self.app = app
        self.ctx:mgl.Context = app.ctx
        self.textures = {}
        self.textures['floor'] = self.get_texture(path='textures/tiles/Tiles107_1K-PNG_ColorR.png')
        self.textures['diff'] = self.get_texture(path='objects/sphere/diff_v1.jpg')
        self.textures['rough'] = self.get_texture(path='textures/tiles/Tiles107_1K-PNG_Roughness.png')

        self.textures['brdfLUT'] = self.get_brdf_texture(path='ibl_brdf_lut.png')
        
        self.textures['skybox'] = self.get_texture_cube(dir_path='textures/skybox1/', ext='png')
        self.textures['depth_texture'] = self.get_depth_texture(app.light.RESOLUTION * app.light.ppsm)
        

    def get_depth_texture(self, size):
        depth_texture = self.ctx.depth_texture(size)
        depth_texture.repeat_x = False
        depth_texture.repeat_y = False
        return depth_texture

    def get_render_depth(self, size, comps=3):
        depth_texture = self.ctx.depth_texture(size, components=comps)
        return depth_texture
    
    def get_render_texture(self, size, comps=4):
        depth_texture = self.ctx.texture(size, components=comps, dtype='f4')
        return depth_texture

    def get_texture_cube(self, dir_path, ext='png'):
        faces = ['right', 'left', 'top', 'bottom'] + ['front', 'back'][::-1]
        # textures = [pg.image.load(dir_path + f'{face}.{ext}').convert() for face in faces]
        textures = []
        for face in faces:
            texture = pg.image.load(dir_path + f'{face}.{ext}').convert()
            if face in ['right', 'left', 'front', 'back']:
                texture = pg.transform.flip(texture, flip_x=True, flip_y=False)
            else:
                texture = pg.transform.flip(texture, flip_x=False, flip_y=True)
            textures.append(texture)

        size = textures[0].get_size()
        texture_cube = self.ctx.texture_cube(size=size, components=3, data=None)

        for i in range(6):
            texture_data = pg.image.tostring(textures[i], 'RGB')
            texture_cube.write(face=i, data=texture_data)

            
        texture_cube.filter = (mgl.LINEAR_MIPMAP_LINEAR, mgl.LINEAR)
        texture_cube.build_mipmaps(max_level=64)

        return texture_cube

    def get_texture(self, path):
        texture = pg.image.load(path).convert()
        texture = pg.transform.flip(texture, flip_x=False, flip_y=True)
        texture = self.ctx.texture(size=texture.get_size(), components=3,
                                   data=pg.image.tostring(texture, 'RGB'))
        # mipmaps
        texture.filter = (mgl.LINEAR_MIPMAP_LINEAR, mgl.LINEAR)
        texture.build_mipmaps()
        # AF
        texture.anisotropy = 32.0
        return texture
    
    
    def get_brdf_texture(self, path):
        texture = pg.image.load(path).convert()
        texture = pg.transform.flip(texture, flip_x=False, flip_y=True)
        texture = self.ctx.texture(size=texture.get_size(), components=3,
                                   data=pg.image.tostring(texture, 'RGB'))
        texture.repeat_x = False 
        texture.repeat_y = False
        return texture

    def destroy(self):
        [tex.release() for tex in self.textures.values()]
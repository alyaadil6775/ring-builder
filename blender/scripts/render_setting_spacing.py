import bpy
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'blender/renders/setting-spacing'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12
scene.render.resolution_x=420;scene.render.resolution_y=360;scene.render.resolution_percentage=100
scene.world.color=(.4,.4,.4)
def material(name,color,metallic):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Metallic'].default_value=metallic;b.inputs['Roughness'].default_value=.2
 return m
gold=material('Gold',(.65,.42,.14),1);blue=material('Center',(.025,.08,.65),.1);purple=material('Side',(.3,.025,.4),.1)
for loc in [(12,-15,25),(-12,-8,20),(0,15,18)]:
 bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.data.energy=1600;light.data.size=12;light.rotation_euler=(Vector((0,0,3))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(4,-30,30));scene.camera=bpy.context.object
scene.camera.data.type='ORTHO';scene.camera.data.ortho_scale=29
scene.camera.rotation_euler=(Vector((0,0,3))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
for path in sorted(OUT.glob('*.obj')):
 for o in list(scene.objects):
  if o.type=='MESH':bpy.data.objects.remove(o,do_unlink=True)
 bpy.ops.wm.obj_import(filepath=str(path))
 for o in scene.objects:
  if o.type=='MESH':
   o.data.materials.clear();o.data.materials.append(blue if 'center-gem' in o.name else purple if 'side-gem' in o.name else gold)
 scene.render.filepath=str(path.with_suffix('.png'));bpy.ops.render.render(write_still=True)

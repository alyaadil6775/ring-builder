from pathlib import Path
from PIL import Image,ImageDraw
out=Path(__file__).resolve().parents[1]/'blender/renders/band-seams'
names=['flat','knife-edge','soft-square','tapered','reverse-tapered','split-shank','twisted','rope','bypass','open','wide','sculpted-organic','vintage','rounded']
for page in range(2):
 sheet=Image.new('RGB',(720,7*266),'#faf8f4');d=ImageDraw.Draw(sheet)
 for row,name in enumerate(names[page*7:(page+1)*7]):
  for col,version in enumerate(['before','after']):
   d.text((col*360+8,row*266+5),name.replace('-',' ').title()+' — '+version,fill='#171717')
   sheet.paste(Image.open(out/(name+'-'+version+'.png')),(col*360,row*266+26))
 sheet.save(out/('comparison-'+str(page+1)+'.png'))

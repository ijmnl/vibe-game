"""Contact sheet of the whole roster, in the game's own colours."""
import sys
from PIL import Image, ImageDraw
import roster

ORDER = ['Slime', 'Oozer', 'Rat', 'Rattler', 'Bird', 'Stormwing', 'Fox', 'Pyrefox',
         'Spider', 'Owl', 'Fish', 'Crab', 'Turtle', 'Bat', 'Snake', 'Golem',
         'Scorpion', 'Vulture', 'Camel', 'Moth', 'Emberfly', 'Lampwing', 'Dusker', 'Volcanor']


def build(path, names=None, zoom=5, cols=8):
    names = names or ORDER
    N, GAP = 32, 3
    rows = (len(names) + cols - 1) // cols
    img = Image.new('RGBA', (cols * (N + GAP) * zoom, rows * ((N + GAP) * zoom + 14)),
                    (46, 50, 62, 255))
    px = img.load()
    draw = ImageDraw.Draw(img)

    for i, name in enumerate(names):
        grid, pal = roster.draw(name), roster.pal(name)
        ox = (i % cols) * (N + GAP) * zoom
        oy = (i // cols) * ((N + GAP) * zoom + 14)
        for y, row in enumerate(grid):
            for x, ch in enumerate(row):
                c = pal.get(ch)
                if not c:
                    continue
                for dy in range(zoom):
                    for dx in range(zoom):
                        px[ox + x * zoom + dx, oy + y * zoom + dy] = (*c, 255)
        draw.text((ox + 6, oy + N * zoom + 4), name, fill=(210, 216, 232))

    img.save(path)
    return path


if __name__ == '__main__':
    out = sys.argv[1]
    picked = sys.argv[2:] or None
    print(build(out, picked))

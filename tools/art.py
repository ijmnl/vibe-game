"""Generate pixel-art grids for the monsters.

The grids are the deliverable - they get pasted into SpriteFactory as data.
Generating them from an implicit shape plus a light direction, rather than
typing 32 rows of 32 characters by hand, keeps silhouettes smooth and keeps
the shading consistent between a species and the thing it evolves into.
"""
import math
from PIL import Image

N = 32
LIGHT = (0.40, 0.28)

# Body ramp, darkest to brightest
RAMP = ['5', '2', '1', '3', '6']


def blob(shapes):
    def inside(x, y):
        return any(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0
                   for (cx, cy, rx, ry) in shapes)
    return inside


def poly(points):
    """Point-in-polygon, for the things ellipses cannot do: ears, claws, fins."""
    def inside(x, y):
        hit = False
        count = len(points)
        for i in range(count):
            ax, ay = points[i]
            bx, by = points[(i + 1) % count]
            if (ay > y) != (by > y):
                cross = ax + (y - ay) / (by - ay) * (bx - ax)
                if x < cross:
                    hit = not hit
        return hit
    return inside


def union(*parts):
    return lambda x, y: any(part(x, y) for part in parts)


def without(shape, *holes):
    return lambda x, y: shape(x, y) and not any(hole(x, y) for hole in holes)


# A marking keeps the shading it was given but swaps to the accent ramp, so a
# white chest or a pale tail tip still turns with the light.
ACCENT_FOR = {'5': 'a', '2': 'a', '1': 'A', '3': 'B', '6': 'B', 'w': 'B'}


def mark(region):
    def apply(grid):
        for y in range(N):
            for x in range(N):
                if grid[y][x] in ACCENT_FOR and region(x + 0.5, y + 0.5):
                    grid[y][x] = ACCENT_FOR[grid[y][x]]
    return apply


def _clean(grid):
    """Drop pixels hanging off the silhouette by a single cell - they read as
    dirt on the sprite rather than as shape."""
    for _ in range(2):
        for y in range(N):
            for x in range(N):
                if grid[y][x] == '.':
                    continue
                neighbours = sum(
                    1 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
                    if 0 <= x + dx < N and 0 <= y + dy < N and grid[y + dy][x + dx] != '.'
                )
                if neighbours <= 1:
                    grid[y][x] = '.'


def _outline(grid, char='o'):
    marked = [row[:] for row in grid]
    for y in range(N):
        for x in range(N):
            if grid[y][x] == '.':
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < N and 0 <= ny < N) or grid[ny][nx] == '.':
                    marked[y][x] = char
                    break
    return marked


def eye(grid, x, y, *, tall=3, wide=2, catchlight=True):
    """A rounded eye with a highlight in the top-left, which is what makes a
    blank shape read as a face rather than as two holes."""
    for row in range(tall):
        for col in range(wide):
            px, py = x + col, y + row
            if 0 <= px < N and 0 <= py < N and grid[py][px] != '.':
                grid[py][px] = 'e'
    # A catchlight, sized to the eye. Two pixels in a three-wide eye turns it
    # into a headlight; one pixel in a five-wide eye vanishes.
    if catchlight:
        lit = 2 if wide >= 4 else 1
        for px in range(x, x + lit):
            if 0 <= px < N and 0 <= y < N and grid[y][px] == 'e':
                grid[y][px] = 'W'


def mouth(grid, x, y, width):
    for col in range(width):
        px = x + col
        if 0 <= px < N and grid[y][px] not in ('.', 'o'):
            grid[y][px] = 'e'
    # Turn the corners up
    for px, py in ((x - 1, y - 1), (x + width, y - 1)):
        if 0 <= px < N and 0 <= py < N and grid[py][px] not in ('.', 'o'):
            grid[py][px] = 'e'


def render(inside, *, style='house', floor=None, face=None, specular=(), markings=()):
    """style: 'house' - the one the game uses: five tones, one heavy outline
              'soft' - the same shading with a thin outline
              'chunky' - three tones, doubled outline
              'rimlit' - soft, plus a bright edge on the lit side"""
    tones = RAMP if style != 'chunky' else ['2', '1', '6']
    thick_outline = style == 'chunky'
    heavy_outline = style == 'house'

    mask = [[inside(x + 0.5, y + 0.5) and (floor is None or y < floor)
             for x in range(N)] for y in range(N)]

    # Distance from each filled pixel to the nearest empty one. Shading off
    # this rather than off one global lamp is what stops whichever part
    # happens to sit nearest the light from blowing out: every limb, ear and
    # tail gets its own rounding.
    depth = [[0.0] * N for _ in range(N)]
    frontier = []
    for y in range(N):
        for x in range(N):
            if not mask[y][x]:
                continue
            edge = any(
                not (0 <= x + dx < N and 0 <= y + dy < N) or not mask[y + dy][x + dx]
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            )
            if edge:
                depth[y][x] = 1.0
                frontier.append((x, y))

    head = 0
    while head < len(frontier):
        x, y = frontier[head]
        head += 1
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < N and 0 <= ny < N and mask[ny][nx] and depth[ny][nx] == 0.0:
                depth[ny][nx] = depth[y][x] + 1.0
                frontier.append((nx, ny))

    # An approximate surface normal from the slope of that depth field, so the
    # light can pick out which way each part is facing.
    lx, ly = -0.66, -0.75

    grid = [['.'] * N for _ in range(N)]
    for y in range(N):
        for x in range(N):
            if not mask[y][x]:
                continue

            def at(px, py):
                return depth[py][px] if 0 <= px < N and 0 <= py < N else 0.0

            gx = at(x + 1, y) - at(x - 1, y)
            gy = at(x, y + 1) - at(x, y - 1)
            length = math.hypot(gx, gy) or 1.0
            facing = (gx / length) * lx + (gy / length) * ly

            # Round shapes off toward their edges, then push the lit side up.
            # Weighted so the base tone is what most of the body lands on and
            # the light reads as a highlight rather than as the norm.
            # The +1.2 keeps thin parts - ears, fins, claws - from bottoming
            # out at the darkest tone just for being narrow
            body = min((depth[y][x] + 1.2) / 5.2, 1.0)
            level = body * 0.40 + (facing * 0.5 + 0.5) * 0.46

            step = min(len(tones) - 1, max(0, int(level * len(tones))))
            grid[y][x] = tones[step]

    _clean(grid)
    if style != 'house':
        grid = _outline(grid)

    # A darker band inside the lower-right edge, so the form turns away
    for y in range(N):
        for x in range(N):
            if grid[y][x] in ('.', 'o'):
                continue
            away = any(
                not (0 <= x + dx < N and 0 <= y + dy < N) or grid[y + dy][x + dx] == '.'
                for dx, dy in ((1, 0), (0, 1), (1, 1), (2, 0), (0, 2))
            )
            if away:
                grid[y][x] = '5' if grid[y][x] in ('1', '2', '5') else '2'

    if heavy_outline:
        # Drawn outwards rather than eating into the body, so the creature
        # separates from whatever it stands on without losing a pixel of
        # itself - and stays a single clean line rather than a double border.
        widened = [row[:] for row in grid]
        for y in range(N):
            for x in range(N):
                if grid[y][x] != '.':
                    continue
                touching = any(
                    0 <= x + dx < N and 0 <= y + dy < N and grid[y + dy][x + dx] not in ('.',)
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
                )
                if touching:
                    widened[y][x] = 'o'
        grid = widened

    if thick_outline:
        # A second ring of outline: at small sizes a heavy line is what keeps
        # the creature separate from whatever it is standing on
        grid = [list(row) for row in _outline([r[:] for r in grid])]

    if style == 'rimlit':
        # A bright edge on the lit side, and a pale band along the very
        # bottom, which is what a body you can see through actually does
        for y in range(N):
            for x in range(N):
                if grid[y][x] in ('.', 'o', 'e', 'W'):
                    continue
                toward = any(
                    not (0 <= x + dx < N and 0 <= y + dy < N) or grid[y + dy][x + dx] == '.'
                    for dx, dy in ((-1, 0), (0, -1), (-1, -1))
                )
                if toward:
                    grid[y][x] = 'w'

        for x in range(N):
            column = [y for y in range(N) if grid[y][x] not in ('.', 'o')]
            if not column:
                continue
            for y in column[-3:]:
                if grid[y][x] not in ('e', 'W'):
                    grid[y][x] = '3'

    for apply in markings:
        apply(grid)

    for (sx, sy, w, h) in specular:
        for y in range(sy, sy + h):
            for x in range(sx, sx + w):
                if 0 <= x < N and 0 <= y < N and grid[y][x] not in ('.', 'o'):
                    grid[y][x] = 'w'

    if face:
        face(grid)

    return [''.join(row) for row in grid]


def palette(base, dark, light, accent_mid, outline=None):
    """Build a preview ramp from the four colours a species already has in
    SpriteFactory, so what is previewed is what will ship."""
    def mix(a, b, t):
        return tuple(round(x + (y - x) * t) for x, y in zip(a, b))

    black = (16, 18, 30)
    white = (255, 255, 255)
    return {
        '.': None,
        'o': outline or mix(dark, black, 0.62),
        '5': mix(dark, black, 0.28),
        '2': dark,
        '1': base,
        '3': light,
        '6': mix(light, white, 0.45),
        'w': mix(light, white, 0.82),
        'e': (24, 28, 44),
        'W': white,
        'a': mix(accent_mid, black, 0.42),
        'A': accent_mid,
        'B': mix(accent_mid, white, 0.55),
    }


PALETTES = {
    'Slime': palette((79, 195, 247), (43, 143, 196), (143, 224, 255), (210, 240, 255)),
    'Oozer': palette((47, 127, 208), (28, 83, 144), (99, 180, 255), (190, 226, 255)),
    'Fox':   palette((240, 122, 60), (184, 64, 42), (255, 166, 114), (252, 226, 196)),
    'Pyrefox': palette((224, 58, 28), (156, 36, 16), (255, 122, 72), (255, 217, 160)),
}

PREVIEW = {
    '.': None,
    'o': (24, 44, 72),
    '5': (30, 92, 148),
    '2': (52, 140, 200),
    '1': (79, 176, 235),
    '3': (132, 210, 246),
    '6': (190, 234, 252),
    'w': (247, 253, 255),
    'e': (24, 32, 50),
    'W': (255, 255, 255),
    'a': (176, 132, 96),
    'A': (232, 198, 158),
    'B': (255, 244, 226),
}


def save(grids, path, zoom=9, gap=2, labels=None, bg=(58, 62, 74), palettes=None):
    from PIL import ImageDraw
    label_room = 16 if labels else 0
    width = (N * len(grids) + gap * (len(grids) - 1)) * zoom
    img = Image.new('RGBA', (width, N * zoom + label_room), (*bg, 255))
    px = img.load()

    for i, grid in enumerate(grids):
        ox = i * (N + gap) * zoom
        pal = (palettes[i] if palettes else None) or PREVIEW
        for y, row in enumerate(grid):
            for x, ch in enumerate(row):
                color = pal.get(ch)
                if not color:
                    continue
                for dy in range(zoom):
                    for dx in range(zoom):
                        px[ox + x * zoom + dx, y * zoom + dy] = (*color, 255)

    if labels:
        draw = ImageDraw.Draw(img)
        for i, text in enumerate(labels):
            draw.text((i * (N + gap) * zoom + 6, N * zoom + 2), text, fill=(230, 230, 240))

    img.save(path)
    return path


def show(grid):
    print('\n'.join(grid))


def brow(grid, x, y, width):
    """A dark ridge over the eyes. It is the whole difference between a young
    creature and the thing it grows into."""
    for col in range(width):
        px = x + col
        if 0 <= px < N and grid[y][px] not in ('.', 'o'):
            grid[y][px] = '5'


def crease(grid, points, char='5'):
    """A darker line inside the body, to separate a leg from a leg or a tail
    from a flank. Without it a four-legged creature is one orange lump."""
    for (x, y) in points:
        if 0 <= x < N and 0 <= y < N and grid[y][x] not in ('.', 'o'):
            grid[y][x] = char


def vline(x, y0, y1):
    return [(x, y) for y in range(y0, y1)]


def hline(y, x0, x1):
    return [(x, y) for x in range(x0, x1)]


def fangs(grid, x, y, width):
    """A jagged mouth. A smile is fine on a starter; the thing at the end of
    the game should not be smiling."""
    for col in range(width):
        px = x + col
        if 0 <= px < N and grid[y][px] not in ('.', 'o'):
            grid[y][px] = 'e'
    for col in range(0, width, 2):
        px = x + col
        if 0 <= px < N and 0 <= y - 1 < N and grid[y - 1][px] not in ('.', 'o'):
            grid[y - 1][px] = 'W'
        if 0 <= px < N and 0 <= y + 1 < N and grid[y + 1][px] not in ('.', 'o'):
            grid[y + 1][px] = 'W'


def plates(grid, rows, char='5'):
    """Segment lines across a shell or a rocky hide."""
    for (y, x0, x1) in rows:
        for x in range(x0, x1):
            if 0 <= x < N and 0 <= y < N and grid[y][x] not in ('.', 'o', 'e', 'W'):
                grid[y][x] = char

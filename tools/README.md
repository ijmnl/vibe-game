# Sprite generator

The monster grids in `js/utils/SpriteFactory.js` are data, but the newer 32x32
ones are not typed by hand - 32 rows of 32 characters is too error-prone to
edit directly, and hand-shading twenty-four creatures consistently is harder
still.

Instead each creature is *described* - a union of ellipses and polygons - and
then lit. `art.py` works out how deep every pixel sits inside the body, derives
an approximate surface normal from that, and picks a tone. An ear rounds like
an ear and a tail rounds like a tail, and a species and the thing it evolves
into come out lit the same way.

```bash
cd tools
python3 -c "
from fox import fox
from art import save, PALETTES
save([fox()], 'preview.png', zoom=12, palettes=[PALETTES['Fox']])
"
```

Paste the printed grid into `SHAPES` in `SpriteFactory.js` and point the
species at it in `SPECIES_SHAPE`. The characters map to the ramp built by
`monsterPalette()`:

```
o          outline
5 2 1 3 6  body, darkest to lightest
w          specular highlight
a A B      pale markings - ear insides, muzzle, chest, tail tip
e W        eye, and its catchlight
```

Redrawn so far: Slime, Oozer, Fox. The rest still use the older 16x16 grids,
which the same painter handles - it sizes each texture from its own grid.

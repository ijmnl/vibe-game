"""Every species, wired to a body plan, a face and its markings.

Colours come straight out of SpriteFactory so a preview here is what the game
will actually draw.
"""
import re
from art import *
from creatures import *
from fox import build_fox, FOX_PALE, fox_face


def game_colors(path='../js/utils/SpriteFactory.js'):
    src = open(path).read()
    block = re.search(r'MONSTER_COLORS: \{(.*?)\n    \},', src, re.S).group(1)
    out = {}
    for name, values in re.findall(r"(\w+):\s*\[([^\]]*)\]", block):
        colors = [c.strip().strip("'") for c in values.split(',')]
        out[name] = colors
    return out


COLORS = game_colors()


def pal(name):
    c = COLORS.get(name, ['#888888', '#555555', '#bbbbbb', '#ffffff'])
    to_rgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
    accent = to_rgb(c[4] if len(c) > 4 else c[3])
    return palette(to_rgb(c[0]), to_rgb(c[1]), to_rgb(c[2]), accent)


def ears_inner(left, right, size=1.0):
    return union(poly([(left + 0.8, 9.2), (left - 0.8, 4.2), (left + 3.4, 7.4)]),
                 poly([(right - 0.8, 9.2), (right + 0.8, 4.2), (right - 3.4, 7.4)]))


def face_pale(cx=15.5, cy=15.6, rx=2.4, ry=2.0):
    return blob([(cx, cy, rx, ry)])


SPECIES = {}


def species(name, shape, *, face=None, markings=(), specular=((11, 6, 3, 2),), floor=None):
    SPECIES[name] = dict(shape=shape, face=face, markings=markings,
                         specular=specular, floor=floor)


def draw(name):
    spec = SPECIES[name]
    return render(spec['shape'], style='house', floor=spec['floor'],
                  face=spec['face'], markings=spec['markings'],
                  specular=spec['specular'])


# --- the roster ----------------------------------------------------------

# Water
species('Slime', blob([(16.0, 20.0, 12.2, 9.8), (15.2, 13.6, 8.4, 7.4),
                       (17.6, 16.0, 8.0, 7.0)]),
        face=lambda g: (eye(g, 11, 17, tall=4, wide=3), eye(g, 19, 17, tall=4, wide=3),
                        mouth(g, 14, 23, 4)) and None,
        specular=((10, 9, 4, 2), (11, 8, 3, 1)), floor=28)

species('Oozer', blob([(16, 22.0, 13.8, 8.6), (13.4, 15.6, 9.0, 7.4), (19.6, 16.2, 9.6, 7.8),
                       (4.8, 24.0, 5.4, 3.8), (27.2, 24.0, 5.4, 3.8),
                       (11.0, 8.6, 2.8, 3.6), (21.4, 9.0, 2.6, 3.4)]),
        face=lambda g: (brow(g, 8, 16, 6), brow(g, 18, 16, 6),
                        eye(g, 9, 17, tall=3, wide=4), eye(g, 19, 17, tall=3, wide=4),
                        mouth(g, 13, 23, 6)) and None,
        specular=((10, 11, 4, 2), (11, 10, 3, 1)), floor=29)

# Rodents - rounded ears, a thin tail, and a snout rather than a muzzle
species('Rat', quadruped(ear='round', ear_size=1.0, tail='thin', bulk=0.92, snout=0.4),
        face=quadruped_face(eye_y=10, grin=3),
        markings=(mark(union(ears_inner(9.0, 22.0), face_pale(15.5, 16.0, 2.6, 2.2),
                             blob([(15.5, 21.6, 3.0, 3.0)]))),))

species('Rattler', quadruped(ear='round', ear_size=1.15, tail='thin', bulk=1.12, snout=0.8),
        face=quadruped_face(eye_y=10, brow=True, grin=5),
        markings=(mark(union(ears_inner(9.0, 22.0), face_pale(15.5, 16.4, 3.0, 2.4),
                             blob([(15.5, 21.8, 3.4, 3.2)]))),))

# The Fox line
species('Fox', build_fox(), face=fox_face, markings=(mark(FOX_PALE),))

species('Pyrefox', quadruped(ear='point', ear_size=1.6, tail='bush', bulk=1.18, horn=False),
        face=quadruped_face(eye_y=10, brow=True, grin=5),
        markings=(mark(union(ears_inner(9.6, 21.4, 1.2), face_pale(15.5, 15.8, 2.6, 2.2),
                             blob([(15.5, 21.4, 3.0, 3.0)]),
                             blob([(26.4, 15.0, 3.0, 3.0)]))),))

# Desert quadrupeds
species('Camel', quadruped(ear='round', ear_size=0.7, tail='stub', bulk=1.16, ruff=True,
                           tall_legs=True, snout=1.2),
        face=quadruped_face(eye_y=9, grin=4),
        markings=(mark(union(face_pale(15.5, 16.8, 3.2, 2.6),
                             blob([(15.5, 19.6, 6.4, 3.0)]))),))

species('Dusker', quadruped(ear='long', ear_size=1.0, tail='bush', bulk=1.0),
        face=quadruped_face(eye_y=10, brow=True, grin=4),
        markings=(mark(union(blob([(9.4, 6.6, 1.2, 3.2)]), blob([(21.6, 6.6, 1.2, 3.2)]),
                             face_pale(15.5, 15.8, 2.2, 1.8),
                             blob([(26.4, 15.0, 2.6, 2.6)]))),))

# Flyers
species('Bird', flyer(span=0.6, body=0.95, crest='tuft'),
        face=flyer_face(eye_y=8), specular=((12, 6, 3, 2),),
        markings=(mark(blob([(16.0, 17.6, 3.2, 3.6)])),))

species('Stormwing', flyer(span=1.6, body=1.12, crest='horns'),
        face=flyer_face(eye_y=8, big_eyes=True), specular=((12, 6, 3, 2),),
        markings=(mark(union(blob([(16.0, 18.0, 3.6, 4.0)]),
                             poly([(12.6, 7.4), (11.0, 2.6), (15.0, 6.0)]),
                             poly([(19.4, 7.4), (21.0, 2.6), (17.0, 6.0)]))),))

species('Owl', flyer(span=0.4, body=1.15, wing='broad', tail='fan'),
        face=flyer_face(eye_y=7, big_eyes=True), specular=((12, 5, 3, 2),),
        markings=(mark(union(blob([(16.0, 17.8, 4.0, 4.2)]),
                             blob([(13.4, 8.6, 2.8, 2.8)]), blob([(18.6, 8.6, 2.8, 2.8)]))),))

species('Vulture', flyer(span=1.2, body=1.05, wing='broad', tail='point', bare_neck=True),
        face=flyer_face(eye_y=5, beak=True), specular=((13, 4, 3, 2),),
        markings=(mark(union(blob([(16.0, 6.4, 3.2, 3.4)]), blob([(16.0, 9.6, 2.0, 3.2)]))),))

species('Bat', flyer(span=1.4, body=0.86, wing='membrane', crest='horns', tail='point',
                     legs=False),
        face=flyer_face(eye_y=8, beak=False, grin=4), specular=((12, 6, 3, 2),),
        markings=(mark(blob([(16.0, 16.0, 2.6, 3.0)])),))

# Night flyers
species('Moth', flyer(span=1.3, body=0.9, wing='broad', crest='antennae', tail='point',
                      legs=False),
        face=flyer_face(eye_y=8, beak=False, big_eyes=True), specular=((12, 6, 3, 2),),
        markings=(mark(union(blob([(7.4, 13.0, 2.6, 2.4)]), blob([(24.6, 13.0, 2.6, 2.4)]),
                             blob([(16.0, 15.6, 2.4, 2.8)]))),))

species('Emberfly', flyer(span=0.5, body=0.8, wing='membrane', crest='antennae',
                          tail='point', legs=False),
        face=flyer_face(eye_y=8, beak=False, big_eyes=False), specular=((12, 6, 3, 2),),
        markings=(mark(union(blob([(16.0, 24.0, 2.6, 3.4)]), blob([(16.0, 15.4, 2.0, 2.4)]))),))

species('Lampwing', flyer(span=1.5, body=1.1, wing='broad', crest='antennae', tail='point',
                          legs=False),
        face=flyer_face(eye_y=8, beak=False, big_eyes=True), specular=((12, 6, 3, 2),),
        markings=(mark(union(blob([(16.0, 23.4, 3.6, 4.2)]), blob([(16.0, 15.6, 2.6, 3.0)]),
                             blob([(7.4, 13.2, 2.8, 2.6)]), blob([(24.6, 13.2, 2.8, 2.6)]))),))

# Arachnids
species('Spider', arachnid(legs=8, abdomen=1.0),
        face=lambda g: (eye(g, 12, 13, tall=2, wide=2), eye(g, 18, 13, tall=2, wide=2),
                        eye(g, 14, 16, tall=2, wide=2), eye(g, 16, 16, tall=2, wide=2)) and None,
        specular=((13, 11, 3, 2),),
        markings=(mark(blob([(16.0, 21.6, 3.4, 3.0)])),))

species('Scorpion', arachnid(legs=4, sting=True, claws=True, abdomen=0.92),
        face=lambda g: (eye(g, 13, 14, tall=2, wide=2), eye(g, 17, 14, tall=2, wide=2)) and None,
        specular=((13, 11, 3, 2),),
        markings=(mark(poly([(26.0, 16.4), (30.0, 11.4), (29.4, 17.2)])),))

# The rest
species('Snake', serpent(),
        face=lambda g: (eye(g, 13, 6, tall=3, wide=3), eye(g, 18, 6, tall=3, wide=3),
                        mouth(g, 15, 11, 3)) and None,
        specular=((14, 4, 3, 2),),
        markings=(mark(union(blob([(16.4, 10.4, 3.0, 2.0)]), blob([(15.0, 18.0, 2.4, 2.0)]),
                             blob([(15.0, 25.4, 2.8, 2.2)]))),))

species('Fish', finned(),
        face=lambda g: (eye(g, 10, 13, tall=3, wide=3), mouth(g, 7, 18, 3)) and None,
        specular=((11, 11, 3, 2),),
        markings=(mark(union(blob([(15.0, 20.0, 5.0, 2.4)]), blob([(27.0, 16.0, 2.6, 4.0)]))),))

species('Crab', crustacean(),
        face=lambda g: (eye(g, 12, 9, tall=3, wide=2), eye(g, 19, 9, tall=3, wide=2),
                        mouth(g, 14, 21, 4)) and None,
        specular=((12, 16, 3, 2),),
        markings=(mark(union(blob([(4.6, 11.4, 2.6, 2.0)]), blob([(27.4, 11.4, 2.6, 2.0)]),
                             blob([(16.0, 20.4, 4.0, 2.4)]))),))

species('Turtle', shelled(),
        face=lambda g: (eye(g, 6, 11, tall=3, wide=2), mouth(g, 4, 15, 3),
                        plates(g, [(16, 12, 26), (21, 11, 27),
                                   (18, 17, 18), (23, 17, 18)])) and None,
        specular=((14, 14, 4, 2),),
        markings=(mark(union(blob([(17.0, 19.6, 6.0, 4.0)]), blob([(7.0, 12.0, 2.6, 2.4)]))),))

species('Golem', boulder(arms=True, spikes=3),
        face=lambda g: (brow(g, 10, 13, 5), brow(g, 17, 13, 5),
                        eye(g, 11, 14, tall=2, wide=3), eye(g, 18, 14, tall=2, wide=3),
                        mouth(g, 13, 19, 6),
                        plates(g, [(17, 6, 12), (17, 20, 26), (22, 7, 25),
                                   (12, 7, 11), (12, 21, 25)])) and None,
        specular=((12, 11, 4, 2),),
        markings=(mark(union(poly([(7.8, 10.0), (10.0, 3.4), (12.2, 10.0)]),
                             poly([(19.8, 10.0), (22.0, 3.4), (24.2, 10.0)]))),))

species('Volcanor', titan(),
        face=lambda g: (brow(g, 9, 9, 7), brow(g, 16, 9, 7),
                        eye(g, 10, 10, tall=2, wide=4), eye(g, 18, 10, tall=2, wide=4),
                        fangs(g, 12, 15, 9),
                        plates(g, [(22, 8, 24), (26, 10, 22)])) and None,
        specular=((12, 8, 4, 2),),
        markings=(mark(union(poly([(10.4, 8.0), (8.2, 0.8), (14.4, 5.6)]),
                             poly([(21.6, 8.0), (23.8, 0.8), (17.6, 5.6)]),
                             blob([(16.0, 21.0, 5.0, 3.4)]))),))

"""Every monster in the game, described rather than drawn.

One builder per species. Families share a builder and differ by argument, so
a creature and the thing it evolves into come out recognisably related - the
evolution is the same animal, heavier, with more of whatever made it itself.
"""
from art import *


# --- four-legged, sitting ------------------------------------------------

def quadruped(*, ear='point', ear_size=1.0, snout=0.0, bulk=1.0, tail='bush',
              horn=False, ruff=False, tall_legs=False):
    """Fox, Rat, Camel, Dusker and their evolutions all share this body."""
    parts = []

    head_w, head_h = 6.4 * (1 + (bulk - 1) * 0.4), 5.8 * (1 + (bulk - 1) * 0.4)
    parts.append(blob([(15.5, 12.0, head_w, head_h)]))

    if snout:
        parts.append(blob([(15.5, 15.0 + snout * 0.6, 3.4 + snout, 2.6 + snout * 0.4)]))
    else:
        parts.append(blob([(15.5, 15.4, 3.2, 2.6)]))

    # Ears: pointed for a fox, rounded for a rodent, tiny for a camel
    if ear == 'point':
        parts += [poly([(9.6, 10.2), (7.2 - ear_size, 2.0), (14.0, 7.2)]),
                  poly([(21.4, 10.2), (23.8 + ear_size, 2.0), (17.0, 7.2)])]
    elif ear == 'round':
        parts += [blob([(9.0, 7.6, 3.4 * ear_size, 3.6 * ear_size)]),
                  blob([(22.0, 7.6, 3.4 * ear_size, 3.6 * ear_size)])]
    elif ear == 'long':
        parts += [blob([(9.4, 7.0, 2.2 * ear_size, 5.2 * ear_size)]),
                  blob([(21.6, 7.0, 2.2 * ear_size, 5.2 * ear_size)])]

    if horn:
        parts += [poly([(11.6, 7.0), (10.2, 1.8), (13.6, 5.6)]),
                  poly([(19.4, 7.0), (20.8, 1.8), (17.4, 5.6)])]

    parts.append(blob([(15.5, 21.4, 6.4 * bulk, 5.2)]))
    parts.append(blob([(15.5, 24.6, 7.0 * bulk, 4.6)]))

    if ruff:
        # Seen from the front a hump is behind the head and simply invisible,
        # so the camel gets its shape from a shaggy shoulder ruff instead
        parts.append(blob([(15.5, 19.4, 8.6, 4.4)]))
        parts.append(blob([(9.4, 20.0, 3.4, 3.0)]))
        parts.append(blob([(21.6, 20.0, 3.4, 3.0)]))

    leg_y, leg_h = (26.4, 4.0) if tall_legs else (27.4, 3.0)
    parts.append(union(blob([(10.8, leg_y, 2.4, leg_h)]), blob([(20.2, leg_y, 2.4, leg_h)]),
                       blob([(14.0, leg_y + 0.4, 2.0, leg_h - 0.4)]),
                       blob([(17.0, leg_y + 0.4, 2.0, leg_h - 0.4)])))

    if tail == 'bush':
        parts.append(union(blob([(22.4, 25.6, 5.0, 4.2)]), blob([(24.6, 23.4, 4.8, 4.4)]),
                           blob([(26.4, 20.4, 4.4, 4.4)]), blob([(27.0, 17.2, 3.8, 3.8)]),
                           blob([(26.2, 14.6, 3.2, 3.2)])))
    elif tail == 'thin':
        parts.append(union(blob([(23.0, 25.8, 3.0, 2.6)]), blob([(25.6, 24.0, 2.6, 2.4)]),
                           blob([(27.4, 21.2, 2.2, 2.6)]), blob([(28.0, 18.4, 2.0, 2.2)])))
    elif tail == 'stub':
        parts.append(blob([(23.6, 25.4, 3.2, 2.8)]))

    return union(*parts)


def quadruped_face(*, eye_y=10, brow=False, snout_line=True, grin=4):
    def apply(grid):
        if brow:
            globals()['brow'](grid, 9, eye_y - 1, 5)
            globals()['brow'](grid, 18, eye_y - 1, 5)
        eye(grid, 11, eye_y, tall=3, wide=2)
        eye(grid, 19, eye_y, tall=3, wide=2)
        if snout_line:
            for x in range(15, 17):
                if grid[eye_y + 4][x] not in ('.', 'o'):
                    grid[eye_y + 4][x] = 'e'
        mouth(grid, 14, eye_y + 7, grin)
        crease(grid, vline(13, 27, 30) + vline(18, 27, 30))
    return apply


# --- winged --------------------------------------------------------------

def flyer(*, span=1.0, body=1.0, crest=None, tail='fan', legs=True, wing='feather',
          bare_neck=False):
    """Bird, Owl, Bat, Vulture, Moth and the rest hang off this one."""
    parts = [blob([(16.0, 15.0, 5.2 * body, 6.4 * body)]),
             blob([(16.0, 9.4, 4.4 * body, 4.2 * body)])]

    if bare_neck:
        # A thin neck between a small head and a heavy ruff - the whole
        # silhouette of a carrion bird
        parts += [blob([(16.0, 6.2, 3.0, 3.2)]), blob([(16.0, 9.6, 1.8, 3.0)]),
                  blob([(16.0, 13.4, 5.8, 3.4)])]

    if wing == 'feather':
        # Swept back and down from the shoulder. Level with the body they
        # meet the tail and the whole bird becomes a star.
        parts += [poly([(11.2, 12.6), (3.0 - span * 2, 17.0), (5.6, 23.4), (11.8, 19.6)]),
                  poly([(20.8, 12.6), (29.0 + span * 2, 17.0), (26.4, 23.4), (20.2, 19.6)])]
    elif wing == 'membrane':
        parts += [poly([(11.4, 10.4), (1.6 - span, 9.0), (3.4, 17.0), (7.0, 15.0),
                        (6.0, 20.0), (11.8, 18.4)]),
                  poly([(20.6, 10.4), (30.4 + span, 9.0), (28.6, 17.0), (25.0, 15.0),
                        (26.0, 20.0), (20.2, 18.4)])]
    elif wing == 'broad':
        parts += [blob([(7.4 - span, 13.6, 6.6 + span, 6.0)]),
                  blob([(24.6 + span, 13.6, 6.6 + span, 6.0)]),
                  blob([(8.6, 19.6, 4.6, 4.0)]), blob([(23.4, 19.6, 4.6, 4.0)])]

    if crest == 'tuft':
        parts.append(poly([(14.0, 6.6), (16.0, 1.6), (18.0, 6.6)]))
    elif crest == 'horns':
        parts += [poly([(12.6, 7.4), (11.0, 2.6), (15.0, 6.0)]),
                  poly([(19.4, 7.4), (21.0, 2.6), (17.0, 6.0)])]
    elif crest == 'antennae':
        parts += [blob([(12.4, 4.6, 1.2, 3.4)]), blob([(19.6, 4.6, 1.2, 3.4)])]

    if tail == 'fan':
        parts.append(poly([(13.4, 20.0), (12.0, 28.0), (20.0, 28.0), (18.6, 20.0)]))
    elif tail == 'point':
        parts.append(poly([(14.2, 20.0), (16.0, 29.0), (17.8, 20.0)]))

    if legs:
        parts.append(union(blob([(13.4, 25.6, 1.6, 3.0)]), blob([(18.6, 25.6, 1.6, 3.0)])))

    return union(*parts)


def flyer_face(*, eye_y=8, beak=True, big_eyes=False, grin=0, wing_crease=True):
    def apply(grid):
        size = 3 if big_eyes else 2
        eye(grid, 12, eye_y, tall=size, wide=size)
        eye(grid, 32 - 12 - size, eye_y, tall=size, wide=size)
        if beak:
            for y in range(eye_y + size, eye_y + size + 3):
                for x in range(15, 17):
                    if grid[y][x] not in ('.', 'o'):
                        grid[y][x] = 'A'
            if grid[eye_y + size + 2][15] not in ('.', 'o'):
                grid[eye_y + size + 2][15] = 'a'
        if grin:
            mouth(grid, 14, eye_y + size + 3, grin)

        # Without a line where the wing meets the flank, a bird is one
        # yellow star rather than a body with wings on it.
        if wing_crease:
            crease(grid, [(11, y) for y in range(12, 21)])
            crease(grid, [(20, y) for y in range(12, 21)])
    return apply


# --- everything else -----------------------------------------------------

def arachnid(*, legs=8, sting=False, claws=False, abdomen=1.0):
    # A narrower body than feels natural, because the legs have to have
    # somewhere to be. A wide thorax simply swallows them.
    parts = [blob([(16.0, 14.6, 5.0, 5.2)]),
             blob([(16.0, 21.0, 6.2 * abdomen, 5.8 * abdomen)])]

    # Legs drawn as a run of small blobs along an arc. Quads at this size come
    # out either buried in the body or as flat triangles; a chain of dots gets
    # rounded by the shading into something that reads as a jointed limb.
    for i in range(legs // 2):
        knee = 2.0 + i * 0.8
        drop = 17.0 + i * 3.6
        for step in range(6):
            t = step / 5.0
            x = 11.6 - (11.6 - knee) * t
            y = 13.0 + i * 1.8 + (drop - 13.0 - i * 1.8) * (t ** 1.5)
            r = 1.6 - t * 0.4
            parts += [blob([(x, y, r, r)]), blob([(32.0 - x, y, r, r)])]

    if claws:
        # Held out in front on short arms, level with the head
        parts += [blob([(11.0, 11.4, 2.6, 1.8)]), blob([(21.0, 11.4, 2.6, 1.8)]),
                  blob([(6.4, 10.4, 3.8, 3.0)]), blob([(25.6, 10.4, 3.8, 3.0)]),
                  poly([(2.6, 8.0), (6.6, 7.2), (7.6, 9.8), (3.4, 10.6)]),
                  poly([(29.4, 8.0), (25.4, 7.2), (24.4, 9.8), (28.6, 10.6)])]
    if sting:
        # Arcing up and forward over its own back, which is the one shape
        # everybody recognises a scorpion by
        parts += [blob([(21.8, 26.2, 3.0, 2.6)]), blob([(25.4, 24.6, 2.8, 2.6)]),
                  blob([(28.0, 21.4, 2.6, 3.0)]), blob([(28.2, 17.6, 2.4, 2.8)]),
                  poly([(26.0, 16.4), (30.0, 11.4), (29.4, 17.2)])]

    return union(*parts)


def serpent():
    return union(blob([(16.4, 8.0, 5.6, 5.0)]),
                 blob([(19.0, 13.4, 4.0, 4.2)]),
                 blob([(15.0, 17.4, 4.2, 4.0)]),
                 blob([(11.6, 21.2, 4.2, 4.0)]),
                 blob([(15.0, 25.0, 5.0, 4.0)]),
                 blob([(20.6, 26.6, 5.4, 3.4)]))


def finned():
    return union(blob([(15.0, 16.0, 8.6, 6.4)]),
                 poly([(22.0, 13.0), (30.0, 8.0), (29.0, 16.0), (30.0, 24.0), (22.0, 19.0)]),
                 poly([(11.0, 10.0), (16.0, 3.0), (18.0, 11.0)]),
                 poly([(11.5, 22.0), (15.0, 28.0), (18.0, 21.0)]),
                 blob([(9.0, 18.6, 3.0, 2.4)]))


def crustacean():
    # Claws held out level with the shell rather than raised over it - raised,
    # they read as ears and the whole animal stops being a crab.
    return union(blob([(16.0, 19.4, 9.0, 5.8)]),
                 blob([(5.6, 19.0, 4.4, 3.8)]), blob([(26.4, 19.0, 4.4, 3.8)]),
                 poly([(1.6, 16.0), (6.2, 14.6), (7.4, 18.0), (2.6, 19.2)]),
                 poly([(30.4, 16.0), (25.8, 14.6), (24.6, 18.0), (29.4, 19.2)]),
                 blob([(12.4, 12.6, 1.6, 3.4)]), blob([(19.6, 12.6, 1.6, 3.4)]),
                 union(*[blob([(x, 25.0, 2.0, 2.6)]) for x in (10.0, 14.0, 18.0, 22.0)]))


def shelled():
    # The head has to sit clear of the shell or the creature has no face
    return union(blob([(17.0, 19.6, 10.0, 6.8)]),
                 blob([(17.0, 17.0, 8.2, 5.0)]),
                 blob([(7.0, 12.4, 4.6, 4.2)]),
                 blob([(9.0, 16.4, 2.6, 3.0)]),
                 blob([(12.0, 25.8, 3.0, 2.8)]), blob([(22.0, 25.8, 3.0, 2.8)]),
                 blob([(27.0, 23.4, 3.0, 2.2)]))


def boulder(*, arms=True, spikes=0):
    # Cut with straight edges rather than ellipses: a rock that rounds off
    # everywhere reads as an animal, and this one is meant to read as stone.
    parts = [poly([(4.0, 26.0), (5.6, 13.0), (11.0, 8.6), (21.0, 8.6),
                   (26.4, 13.0), (28.0, 26.0)])]
    if arms:
        parts += [poly([(0.8, 18.0), (5.0, 15.6), (6.0, 23.0), (1.6, 24.0)]),
                  poly([(31.2, 18.0), (27.0, 15.6), (26.0, 23.0), (30.4, 24.0)])]
    for i in range(spikes):
        x = 10.0 + i * (12.0 / max(1, spikes - 1))
        parts.append(poly([(x - 2.2, 10.0), (x, 3.4), (x + 2.2, 10.0)]))
    parts.append(union(poly([(8.0, 26.0), (13.0, 26.0), (12.4, 30.0), (8.6, 30.0)]),
                       poly([(19.0, 26.0), (24.0, 26.0), (23.4, 30.0), (19.6, 30.0)])))
    return union(*parts)


def titan():
    # The last thing in the game, so it fills the frame corner to corner
    return union(blob([(16.0, 20.0, 12.4, 9.2)]),
                 blob([(16.0, 11.0, 8.8, 6.8)]),
                 poly([(9.6, 7.4), (6.6, 0.6), (14.0, 4.6)]),
                 poly([(22.4, 7.4), (25.4, 0.6), (18.0, 4.6)]),
                 blob([(4.0, 18.4, 4.8, 5.6)]), blob([(28.0, 18.4, 4.8, 5.6)]),
                 poly([(0.8, 13.4), (5.6, 8.2), (6.6, 15.4)]),
                 poly([(31.2, 13.4), (26.4, 8.2), (25.4, 15.4)]),
                 blob([(10.6, 27.4, 4.2, 3.6)]), blob([(21.4, 27.4, 4.2, 3.6)]))

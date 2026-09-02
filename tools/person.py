"""The player and the townsfolk.

One body, four directions, three frames each. Only the arms and legs move
between frames, which is the whole trick: describe the parts once, shift two
of them, and the walk cycle falls out consistent every time.
"""
from art import *

# How far a leg swings forward and back on the two stepping frames. Small
# numbers here look like a shuffle at 32 pixels; it has to be visible.
SWING = [0, 2, -2]

# The body is built narrow on purpose. A torso as wide as the head plus two
# arms outside it gives a barrel, and a barrel with a walk cycle is a barrel
# that waddles.
HEAD = (16.0, 10.2, 5.2, 5.0)
TORSO = (16.0, 19.4, 4.3, 5.0)
ARM_X = (10.6, 21.4)
LEG_X = (13.2, 18.8)


def _legs(direction, frame):
    swing = SWING[frame]

    if direction in ('down', 'up'):
        lx, rx = LEG_X
        legs = union(blob([(lx, 26.0 + swing * 0.5, 2.1, 3.8)]),
                     blob([(rx, 26.0 - swing * 0.5, 2.1, 3.8)]))
        boots = union(blob([(lx, 29.4 + swing * 0.5, 2.4, 1.7)]),
                      blob([(rx, 29.4 - swing * 0.5, 2.4, 1.7)]))
    else:
        # In profile one leg leads and the other trails
        legs = union(blob([(15.0 - swing * 1.2, 26.0, 2.1, 3.8)]),
                     blob([(17.4 + swing * 1.2, 26.0, 2.1, 3.8)]))
        boots = union(blob([(14.4 - swing * 1.5, 29.4, 2.8, 1.7)]),
                      blob([(18.0 + swing * 1.5, 29.4, 2.8, 1.7)]))

    return legs, boots


def _arms(direction, frame):
    swing = SWING[frame]
    lx, rx = ARM_X

    if direction in ('down', 'up'):
        return union(blob([(lx, 19.0 - swing * 0.8, 1.7, 4.0)]),
                     blob([(rx, 19.0 + swing * 0.8, 1.7, 4.0)]))

    # Only the near arm shows in profile
    return blob([(16.4 + swing * 1.4, 19.2, 1.9, 3.8)])


def _torso(direction, frame):
    return union(blob([TORSO]), _arms(direction, frame))


def build(direction='down', frame=0):
    head = blob([HEAD])
    legs, boots = _legs(direction, frame)

    if direction in ('left', 'right'):
        # A nose breaks the profile, and the head sits forward of the shoulders
        head = union(blob([(15.2, 10.2, 5.0, 5.0)]),
                     blob([(10.8, 10.8, 1.6, 1.4)]))

    return union(head, _torso(direction, frame), legs, boots)


def regions(direction='down', frame=0):
    """Which part of the silhouette is skin, hair, cloth or leather."""
    swing = SWING[frame]
    lx, rx = ARM_X

    if direction == 'down':
        face = blob([(16.0, 11.4, 4.3, 3.9)])
        hair = union(blob([(16.0, 7.6, 5.2, 3.2)]),
                     blob([(11.4, 10.2, 1.5, 2.4)]), blob([(20.6, 10.2, 1.5, 2.4)]))
        hands = union(blob([(lx, 21.8 - swing * 0.8, 1.6, 1.6)]),
                      blob([(rx, 21.8 + swing * 0.8, 1.6, 1.6)]))
    elif direction == 'up':
        face = None
        hair = blob([(16.0, 9.4, 5.2, 4.8)])
        hands = union(blob([(lx, 21.8 - swing * 0.8, 1.6, 1.6)]),
                      blob([(rx, 21.8 + swing * 0.8, 1.6, 1.6)]))
    else:
        face = blob([(13.6, 11.2, 3.6, 3.6)])
        hair = union(blob([(15.4, 7.8, 4.8, 3.2)]), blob([(18.4, 10.6, 2.2, 3.0)]))
        hands = blob([(16.4 + swing * 1.4, 21.6, 1.7, 1.6)])

    legs, boots = _legs(direction, frame)

    return dict(face=face, hair=hair, hands=hands, shirt=_torso(direction, frame),
                trousers=legs, boots=boots)


def frame(direction='down', frame_index=0, *, eyes=True):
    shape = build(direction, frame_index)
    parts = regions(direction, frame_index)

    # Shirt first: it maps the body ramp onto itself, so anything drawn over
    # it afterwards still lands on the letters it expects.
    marks = [mark(parts['shirt'], 'shirt'),
             mark(parts['trousers'], 'trousers'),
             mark(parts['boots'], 'boots'),
             mark(parts['hair'], 'hair')]
    if parts['face']:
        marks.append(mark(parts['face'], 'skin'))
    marks.append(mark(parts['hands'], 'skin'))

    def face(grid):
        # A belt, and a line where the shirt ends, so the torso and the legs
        # read as two things rather than as one column
        crease(grid, hline(22, 12, 21), char='5')
        crease(grid, hline(23, 12, 21), char='5')

        # Sleeve seams, or the arms melt into the chest
        if direction in ('down', 'up'):
            crease(grid, vline(12, 16, 22), char='2')
            crease(grid, vline(20, 16, 22), char='2')

        # Between the legs, or they are one column. On a stepping frame the
        # legs have already parted on their own and a line down the middle
        # would fall on the leading thigh.
        if SWING[frame_index] == 0:
            crease(grid, vline(16, 24, 29), char='a')

        if not eyes or direction == 'up':
            return
        if direction == 'down':
            eye(grid, 13, 10, tall=2, wide=2, catchlight=False)
            eye(grid, 17, 10, tall=2, wide=2, catchlight=False)
        else:
            eye(grid, 11, 10, tall=2, wide=2, catchlight=False)

    # No specular: cloth and skin are not wet, and on a head a hard highlight
    # reads as a white cap rather than as light.
    # Cloth is flat, not round: at full roundness the middle of the torso
    # lifts to the brightest tone and reads as a pale bib.
    return render(shape, style='house', face=face, markings=marks, roundness=0.6, lift=0.16)

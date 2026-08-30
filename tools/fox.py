from art import *

# --- Fox -----------------------------------------------------------------
# Front-facing and sitting. The head is narrower than the chest so the
# silhouette has a waist, and the tail wraps round the near hip rather than
# hanging in the air beside it.
def build_fox():
    head   = blob([(15.5, 12.0, 6.4, 5.8)])
    cheeks = union(poly([(9.4, 12.4), (6.8, 16.2), (11.6, 15.8)]),
                   poly([(21.6, 12.4), (24.2, 16.2), (19.4, 15.8)]))
    muzzle = blob([(15.5, 15.4, 3.2, 2.6)])
    ear_l  = poly([(9.6, 10.2), (7.2, 2.0), (14.0, 7.2)])
    ear_r  = poly([(21.4, 10.2), (23.8, 2.0), (17.0, 7.2)])
    chest  = blob([(15.5, 21.4, 6.4, 5.2)])
    body   = blob([(15.5, 24.6, 7.0, 4.6)])
    legs   = union(blob([(10.8, 27.4, 2.4, 3.0)]), blob([(20.2, 27.4, 2.4, 3.0)]),
                   blob([(14.0, 27.8, 2.0, 2.6)]), blob([(17.0, 27.8, 2.0, 2.6)]))
    # A single fat curl sweeping up behind the near hip. Overlapping blobs
    # of a similar size keep it one solid mass - a thin waist anywhere in it
    # shades dark and reads as a hole punched through the tail.
    tail   = union(blob([(22.4, 25.6, 5.0, 4.2)]),
                   blob([(24.6, 23.4, 4.8, 4.4)]),
                   blob([(26.4, 20.4, 4.4, 4.4)]),
                   blob([(27.0, 17.2, 3.8, 3.8)]),
                   blob([(26.2, 14.6, 3.2, 3.2)]))
    return union(head, cheeks, muzzle, ear_l, ear_r, chest, body, legs, tail)


FOX_PALE = union(
    poly([(10.4, 9.2), (8.8, 4.2), (13.0, 7.4)]),
    poly([(20.6, 9.2), (22.2, 4.2), (18.0, 7.4)]),
    blob([(15.5, 15.6, 2.4, 2.0)]),
    blob([(15.5, 21.4, 2.6, 2.8)]),
    blob([(26.6, 15.2, 2.6, 2.6)]),
)


def fox_face(grid):
    eye(grid, 11, 10, tall=3, wide=3)
    eye(grid, 18, 10, tall=3, wide=3)
    # Nose, then a small muzzle line under it
    for x in range(15, 17):
        if grid[14][x] not in ('.', 'o'):
            grid[14][x] = 'e'
    if grid[15][15] not in ('.', 'o'):
        grid[15][15] = 'e'
    if grid[15][16] not in ('.', 'o'):
        grid[15][16] = 'e'
    # Two short creases between the forelegs, and one where the tail passes
    # in front of the flank. More than that and it reads as a picket fence.
    crease(grid, vline(13, 27, 30) + vline(18, 27, 30))
    # The tail passes in front of the flank; without a line along its leading
    # edge the whole right side reads as one orange mass.
    crease(grid, [(21, 26), (21, 25), (21, 24), (22, 23), (22, 22),
                  (23, 21), (23, 20), (24, 19)], char='5')


def fox():
    return render(build_fox(), style='house', face=fox_face,
                  markings=[mark(FOX_PALE)], specular=[(11, 6, 3, 2)])

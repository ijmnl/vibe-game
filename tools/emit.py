"""Emit every species grid as the SHAPES block SpriteFactory expects."""
import roster
from sheet import ORDER

shapes, mapping = [], []
for name in ORDER:
    grid = roster.draw(name)
    assert len(grid) == 32 and all(len(r) == 32 for r in grid), name
    key = name.lower()
    rows = ',\n'.join(f"            '{r}'" for r in grid)
    shapes.append(f"        {key}: [\n{rows}\n        ]")
    mapping.append((name, key))

open('/tmp/shapes.txt', 'w').write(',\n\n'.join(shapes) + '\n')

lines = []
for i in range(0, len(mapping), 2):
    pair = mapping[i:i + 2]
    lines.append('        ' + '  '.join(f"{n}: '{k}'," for n, k in pair))
# Only the final entry may go without a trailing comma
lines[-1] = lines[-1].rstrip(',')
open('/tmp/mapping.txt', 'w').write('\n'.join(lines) + '\n')

print(f'{len(shapes)} shapes, all 32x32')

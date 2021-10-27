# Having built with `yarn build`, run `python3 src/tools/count-build.py extension/background.js`

import sys
from typing import OrderedDict
prefix ="  !*** "
suffix = " ***!"

line_counts = OrderedDict()
active_file = None
active_line_count = None

def store_line_count():
    if active_file and active_line_count:
        line_counts[active_file] = active_line_count

with open(sys.argv[1], 'r') as f:
    for line in f.readlines():
        if line.startswith(prefix):
            store_line_count()
            active_file = line[len(prefix):-len(suffix)]
            active_line_count = 0
        elif active_file:
            active_line_count += 1
    store_line_count()

print("\n".join(( " " + str(line_count).ljust(10) + file_name) for file_name, line_count in line_counts.items()))
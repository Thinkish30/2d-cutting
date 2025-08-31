from flask import Flask, render_template, request, jsonify
from rectpack import newPacker, MaxRectsBssf
import random

app = Flask(__name__)

STOCK_SHEET_SIZES = {
    "48x96": (48, 96),
    "48x120": (48, 120)
}

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/optimize', methods=['POST'])
def optimize():
    data = request.get_json()
    selected_sheets = data['sheets']
    raw_pieces = data['pieces']

    # Convert to flat list of pieces
    original_pieces = []
    for p in raw_pieces:
        l = int(p['length'])
        b = int(p['breadth'])
        q = int(p['quantity'])
        for _ in range(q):
            original_pieces.append((b, l))  # rectpack expects (width,height)

    if not selected_sheets or not original_pieces:
        return jsonify([])

    bin_sizes = [STOCK_SHEET_SIZES[s] for s in selected_sheets]

    best_result = None
    best_sheet_count = float('inf')

    for _ in range(10):  # Try 10 permutations
        pieces = original_pieces[:]
        random.shuffle(pieces)

        packer = newPacker(pack_algo=MaxRectsBssf, rotation=False)
        for rect in pieces:
            packer.add_rect(*rect)

        for b in bin_sizes:
            for _ in range(100):  # Try large number of bins
                packer.add_bin(*b)

        packer.pack()

        packed = []
        for abin in packer:
            bsize = (abin.width, abin.height)
            placed_rects = []
            for rect in abin:
                x, y, w, h = rect.x, rect.y, rect.width, rect.height
                placed_rects.append({
                    'x': x,
                    'y': y,
                    'width': w,
                    'height': h
                })
            packed.append({
                'size': (bsize[1], bsize[0]),  # return as (length, breadth)
                'pieces': placed_rects
            })

        if len(packed) < best_sheet_count:
            best_result = packed
            best_sheet_count = len(packed)

    return jsonify(best_result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

# end of program
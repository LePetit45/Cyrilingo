"""Build the Cyrillic subset of Sofia Sans used for Bulgarian text (spec §3.3).

Sofia Sans draws Bulgarian shapes by default, Л included: Л looks like a Λ and л like a hook-less
Λ. Signs in Bulgaria mostly show the standard Л, so this script maps Л and л to the font's
standard shapes (its `locl` Russian glyphs). The other Bulgarian shapes, Д and д included, stay.

Run from the repository root (needs `pip install fonttools brotli`):

    python3 scripts/fonts/patch-sofia-sans.py
"""

from fontTools.ttLib import TTFont

SOURCE = 'node_modules/@fontsource-variable/sofia-sans/files/sofia-sans-cyrillic-wght-normal.woff2'
TARGET = 'src/lib/assets/fonts/sofia-sans-cyrillic-standard-l.woff2'
STANDARD_SHAPES = {
    0x041B: 'uni041B.loclRUS',  # Л
    0x043B: 'uni043B.loclRUS',  # л
}

font = TTFont(SOURCE)
for table in font['cmap'].tables:
    if table.isUnicode():
        for codepoint, glyph in STANDARD_SHAPES.items():
            table.cmap[codepoint] = glyph
font.flavor = 'woff2'
font.save(TARGET)

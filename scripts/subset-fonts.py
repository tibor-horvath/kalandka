"""Cuts the Hungarian letters ő ű Ő Ű out of the fontsource latin-ext fonts into tiny files (src/assets/fonts).

The latin-ext files hold some 330 letters, and every Hungarian page needs these four of them, so without this the
first visit downloads ~60 kB of fonts for four letters. src/styles/fonts.css uses the small files for those four and
keeps the full latin-ext files for any other letter (a name with č or ł), which download only when such a letter
is on screen.

Run again after updating @fontsource/baloo-2 or @fontsource/nunito:
    python -m pip install "fonttools[woff]"
    python scripts/subset-fonts.py
The fonts are under the SIL Open Font License 1.1, which allows subsets (neither declares a Reserved Font Name).
"""

from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "assets" / "fonts"
# ő ű Ő Ű, the only Hungarian letters outside Latin-1 (keep in step with fonts.css).
HU = [0x0150, 0x0151, 0x0170, 0x0171]
FONTS = {"baloo-2": [600, 700, 800], "nunito": [400, 700]}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for family, weights in FONTS.items():
        for weight in weights:
            source = ROOT / "node_modules" / "@fontsource" / family / "files" / f"{family}-latin-ext-{weight}-normal.woff2"
            target = OUT / f"{family}-hu-{weight}.woff2"
            options = subset.Options()
            options.flavor = "woff2"
            options.layout_features = ["*"]
            font = subset.load_font(str(source), options)
            subsetter = subset.Subsetter(options)
            subsetter.populate(unicodes=HU)
            subsetter.subset(font)
            subset.save_font(font, str(target), options)
            print(f"{target.relative_to(ROOT)}: {target.stat().st_size} bytes")


if __name__ == "__main__":
    main()

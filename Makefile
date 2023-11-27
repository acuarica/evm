ARTIFACTS=$(wildcard .solc/v*/*.json)
PNGS=$(ARTIFACTS:.solc/%=.solc/%.png)
SOLS=$(ARTIFACTS:.solc/%=.solc/%.sol)
HUFF=$(ARTIFACTS:.solc/%=.solc/%.huff)

.PHONY: all sol png huff clean

all: $(PNGS) $(SOLS) $(HUFF)
sol: $(SOLS)
png: $(PNGS)
huff: $(HUFF)

%.png: %
	scripts/cfg.mjs $* | dot -T png > $*.png

%.sol: %
	scripts/sol.mjs $* > $*.sol

%.huff: %
	scripts/dis.mjs $* > $*.huff

clean:
	find .solc \( -name "*.sol" -or -name "*.png" -or -name "*.huff" \) -print -delete

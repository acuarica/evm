ARTIFACTS=$(wildcard .solc/v*/*.json)
DISS=$(ARTIFACTS:.solc/%=.solc/%.dis)
PNGS=$(ARTIFACTS:.solc/%=.solc/%.png)
SOLS=$(ARTIFACTS:.solc/%=.solc/%.sol)
HUFF=$(ARTIFACTS:.solc/%=.solc/%.huff)

.PHONY: all sol png huff clean

all: $(PNGS) $(SOLS) $(HUFF)
dis: $(DISS)
sol: $(SOLS)
png: $(PNGS)
huff: $(HUFF)

%.png: %
	bin/sevm.mjs cfg $* | dot -T png > $*.png

%.sol: %
	bin/sevm.mjs sol $* > $*.sol

%.dis: %
	bin/sevm.mjs dis --no-color $* > $*.dis

%.huff: %
	bin/sevm.mjs huff $* > $*.huff

clean:
	find .solc \( -name "*.sol" -or -name "*.png" -or -name "*.huff" \) -print -delete

ARTIFACTS=$(wildcard .solc/v*/*.json)
DISS=$(ARTIFACTS:.solc/%=.solc/%.dis)
PNGS=$(ARTIFACTS:.solc/%=.solc/%.png)
SOLS=$(ARTIFACTS:.solc/%=.solc/%.sol)

.PHONY: all sol png huff clean

all: $(PNGS) $(SOLS)
dis: $(DISS)
sol: $(SOLS)
png: $(PNGS)

%.png: %
	bin/sevm.mjs cfg $* | dot -T png > $*.png

%.sol: %
	bin/sevm.mjs sol $* > $*.sol

%.dis: %
	bin/sevm.mjs dis --no-color $* > $*.dis

clean:
	find .solc \( -name "*.sol" -or -name "*.png" \) -print -delete

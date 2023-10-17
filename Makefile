ARTIFACTS=$(wildcard .solc/v*/*.json)
PNGS=$(ARTIFACTS:.solc/%=.solc/%.png)
SOLS=$(ARTIFACTS:.solc/%=.solc/%.sol)

.PHONY: all clean

all: $(PNGS) $(SOLS)

%.png: %
	scripts/cfg.mjs $* | dot -T png > $*.png

%.sol: %
	scripts/sol.mjs $* > $*.sol

clean:
	find .solc \( -name "*.sol" -or -name "*.png" \) -print -delete

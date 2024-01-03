ARTIFACTS=$(wildcard .solc/v*/*.json)
DISS=$(ARTIFACTS:.solc/%=.solc/%.dis)
SOLS=$(ARTIFACTS:.solc/%=.solc/%.sol)
YULS=$(ARTIFACTS:.solc/%=.solc/%.yul)

.PHONY: all dis sol yul clean

all: $(DISS) $(SOLS) ${YULS}
dis: $(DISS)
sol: $(SOLS)
yul: $(YULS)

%.dis: %
	bin/sevm.mjs dis --no-color $* > $*.dis

%.sol: %
	bin/sevm.mjs sol $* > $*.sol

%.yul: %
	bin/sevm.mjs yul $* > $*.yul

clean:
	find .solc \( -name "*.dis" -or -name "*.sol" -or -name "*.yul" \) -print -delete

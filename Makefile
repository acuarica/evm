ARTIFACTS=$(wildcard .artifacts/v*/*.json)
DISS=$(ARTIFACTS:.artifacts/%=.artifacts/%.dis)
SOLS=$(ARTIFACTS:.artifacts/%=.artifacts/%.sol)
YULS=$(ARTIFACTS:.artifacts/%=.artifacts/%.yul)

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
	find .artifacts \( -name "*.dis" -or -name "*.sol" -or -name "*.yul" \) -print -delete

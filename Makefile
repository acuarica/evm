EVMJS=yarn --silent ts-node scripts/evmjs.ts

BYTECODES=$(wildcard .contracts/*.bytecode)
PNGS=$(BYTECODES:.contracts/%=.contracts/%.png)
SOLS=$(BYTECODES:.contracts/%=.contracts/%.sol)

.PHONY: all clean

all: $(PNGS) $(SOLS)

%.png: %
	$(EVMJS) cfg $* | dot -T png > $*.png

%.sol: %
	$(EVMJS) decompile $* > $*.sol

clean:
	-rm -r .contracts/

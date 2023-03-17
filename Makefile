EVMJS=yarn --silent ts-node scripts/evmjs.ts

BYTECODE=.bytecode

BYTECODES=$(wildcard $(BYTECODE)/*.bytecode)
PNGS=$(BYTECODES:$(BYTECODE)/%=.contracts/%.png)
SOLS=$(BYTECODES:$(BYTECODE)/%=.contracts/%.sol)

.PHONY: all clean

all: $(PNGS) $(SOLS)

%.png: %
	$(EVMJS) cfg $* | dot -T png > $*.png

%.sol: %
	$(EVMJS) decompile $* > $*.sol

clean:
	-rm -r $(BYTECODE)/

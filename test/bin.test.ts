import chaiExec from '@jsdevtools/chai-exec';
import chai, { expect } from 'chai';
import './utils/snapshot';

chai.use(chaiExec);

describe('::bin', function () {
    const sevm = 'bin/sevm.mjs';

    // Increase timeout to include support for Node 16 on Windows.
    this.timeout(5000);

    it('should exit with a zero code using `--help`', function () {
        const cli = chaiExec(sevm, ['--help']);

        expect(cli.stdout).to.matchSnapshot('out', this);
        expect(cli).stderr.to.be.empty;
        expect(cli).to.exit.with.code(0);
    });

    it('should exit with non-zero code on unknown flag', function () {
        const cli = chaiExec(sevm, ['-h']);

        expect(cli).stdout.to.be.empty;
        expect(cli.stderr).to.matchSnapshot('err', this);
        expect(cli).to.exit.with.not.code(0);
    });

    it('should exit with non-zero code on unknown command', function () {
        const cli = chaiExec(sevm, ['unknowncommand']);

        expect(cli).stdout.to.be.empty;
        expect(cli.stderr).to.matchSnapshot('err', this);
        expect(cli).to.exit.with.not.code(0);
    });

    it('should display metadata from JSON `bytecode`', function () {
        const input = `{
            "bytecode": "60806040525f80fdfea2646970667358221220213295e11660e0fa1851b6245c99f6d8ef0d1ad319b69a6483694b3a316c2dc564736f6c63430008150033",
            "abi": []
        }`;
        const cli = chaiExec(sevm, ['metadata', '-', '--no-color'], { input });

        expect(cli.stdout).to.matchSnapshot('out', this);
        expect(cli).stderr.to.be.empty;
        expect(cli).to.exit.with.code(0);
    });

    it('should run `dis` command and find non-reacheable chunk', function () {
        const cli = chaiExec(sevm, ['dis', '-', '--no-color'], { input: '0x6001600201600c56010203045b62fffefd5b00' });

        expect(cli.stdout).to.matchSnapshot('out', this);
        expect(cli).stderr.to.be.empty;
        expect(cli).to.exit.with.code(0);
    });

    it('should catch error when exec self-destructed contract', function () {
        const cli = chaiExec(sevm, ['metadata', '-', '--no-color'], { input: '0x' });

        expect(cli.stdout).to.be.empty;
        expect(cli).stderr.to.matchSnapshot('err', this);
        expect(cli).to.exit.with.code(3);
    });
});

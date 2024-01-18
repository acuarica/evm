import chaiExec from '@jsdevtools/chai-exec';
import chai, { expect } from 'chai';
import './utils/snapshot';

chai.use(chaiExec);
chaiExec.defaults = {
    command: 'bin/sevm.mjs',
};

describe('::bin', function () {

    // Increase timeout to include support for Node 16 on Windows.
    this.timeout(5000);

    it('should exit with a zero code using `--help`', function () {
        const cli = chaiExec('--help');

        expect(cli).to.exit.with.code(0);
        expect(cli.stdout).to.matchSnapshot('out', this);
        expect(cli).stderr.to.be.empty;
    });

    it('should exit with non-zero code on unknown flag', function () {
        const cli = chaiExec('-h');

        expect(cli).to.exit.with.not.code(0);
        expect(cli).stdout.to.be.empty;
        expect(cli.stderr).to.matchSnapshot('err', this);
    });

    it('should exit with non-zero code on unknown command', function () {
        const cli = chaiExec('unknowncommand');

        expect(cli).to.exit.with.not.code(0);
        expect(cli).stdout.to.be.empty;
        expect(cli.stderr).to.matchSnapshot('err', this);
    });

    it('should display metadata from JSON `bytecode`', function () {
        const input = `{
            "bytecode": "60806040525f80fdfea2646970667358221220213295e11660e0fa1851b6245c99f6d8ef0d1ad319b69a6483694b3a316c2dc564736f6c63430008150033",
            "abi": []
        }`;
        const cli = chaiExec('metadata - --no-color', { input });

        expect(cli).to.exit.with.code(0);
        expect(cli.stdout).to.matchSnapshot('out', this);
        expect(cli).stderr.to.be.empty;
    });

    it('should run `dis` command and find non-reacheable chunk', function () {
        const cli = chaiExec('dis - --no-color', { input: '0x6001600201600c56010203045b62fffefd5b00' });

        expect(cli).to.exit.with.code(0);
        expect(cli.stdout).to.matchSnapshot('out', this);
        expect(cli).stderr.to.be.empty;
    });
});

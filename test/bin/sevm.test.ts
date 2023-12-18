import chaiExec from '@jsdevtools/chai-exec';
import chai, { expect } from 'chai';

chai.use(chaiExec);
chaiExec.defaults = {
    command: 'bin/sevm.mjs',
};

describe('::bin', function () {

    it('should exit with a zero exit code using `--help`', function () {
        const cli = chaiExec('--help');

        expect(cli).to.exit.with.code(0);
        expect(cli).stdout.to.contain('sevm <cmd> <contract>');
        expect(cli).stdout.to.contain('sevm metadata');
        expect(cli).stdout.to.contain('sevm abi');
        expect(cli).stdout.to.contain('sevm dis');
        expect(cli).stdout.to.contain('sevm cfg');
        expect(cli).stdout.to.contain('sevm sol');
        expect(cli).stdout.to.contain('sevm yul');
        expect(cli).stdout.to.contain('sevm huff');
        expect(cli).stdout.to.contain('sevm config');
        expect(cli).stderr.to.be.empty;
    });

    it('should exit with non-zero exit code on unknown flag `-h`', function () {
        const cli = chaiExec('-h');

        expect(cli).to.exit.with.not.code(0);
        expect(cli).stderr.to.contain('At least one command must be specified');
    });

});

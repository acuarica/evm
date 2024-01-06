import chaiExec from '@jsdevtools/chai-exec';
import chai, { expect } from 'chai';

chai.use(chaiExec);
chaiExec.defaults = {
    command: 'bin/sevm.mjs',
};

describe('::bin', function () {

    // Increase timeout to include support for Node 16 on Windows.
    this.timeout(5000);

    it('should exit with a zero exit code using `--help`', function () {
        const cli = chaiExec('--help');

        expect(cli).to.exit.with.code(0);
        expect(cli).stdout.to.contain('sevm <cmd> <contract>');
        expect(cli).stdout.to.contain('sevm metadata');
        expect(cli).stdout.to.contain('sevm abi');
        expect(cli).stdout.to.contain('sevm selectors');
        expect(cli).stdout.to.contain('sevm dis');
        expect(cli).stdout.to.contain('sevm cfg');
        expect(cli).stdout.to.contain('sevm sol');
        expect(cli).stdout.to.contain('sevm yul');
        expect(cli).stdout.to.contain('sevm config');
        expect(cli).stderr.to.be.empty;
    });

    it('should exit with non-zero exit code on unknown flag `-h`', function () {
        const cli = chaiExec('-h');

        expect(cli).to.exit.with.not.code(0);
        expect(cli).stderr.to.contain('At least one command must be specified');
    });

    it('should display metadata from JSON `bytecode`', function () {
        const input = `{
            "bytecode": "60806040525f80fdfea2646970667358221220213295e11660e0fa1851b6245c99f6d8ef0d1ad319b69a6483694b3a316c2dc564736f6c63430008150033",
            "abi": []
        }`;
        const cli = chaiExec('metadata - --no-color', { input });

        expect(cli).to.exit.with.code(0);
        expect(cli).stderr.to.be.empty;
        expect(cli).stdout.to.contain([
            'Contract Metadata',
            'protocol ipfs',
            'hash QmQaEuFFsAwGbKd51LPcsLkKD5NwsB8aAzg7KkRsjuhjf2',
            'solc 0.8.21',
            'url ipfs://QmQaEuFFsAwGbKd51LPcsLkKD5NwsB8aAzg7KkRsjuhjf2',
        ].join('\n'));
    });

    it('should run `dis` command and find non-reacheable chunk', function () {
        const cli = chaiExec('dis - --no-color', { input: '0x6001600201600c56010203045b62fffefd5b00' });

        expect(cli).to.exit.with.code(0);
        expect(cli).stderr.to.be.empty;
        expect(cli, cli.stdout).stdout.to.contain([
            '8 : unreachable',
            '01020304'
            // https://github.com/nodejs/node/issues/5038
        ].join('\n'));
    });
});

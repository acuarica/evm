import chaiExec from '@jsdevtools/chai-exec';
import chai, { expect } from 'chai';
import './utils/snapshot';

chai.use(chaiExec);

/**
 * `FORCE_COLOR: 0` is set to remove colorized output coming from Node. 
 * https://nodejs.org/api/cli.html#force_color1-2-3
 */
const sevmDebugEnv = {
    ...process.env,
    'NODE_DEBUG': 'sevm',
    'FORCE_COLOR': '0',
};

/**
 * Masks `<pid>` and `<addr>` so the test output remains the same between runs and OSes
 */
const maskStderrPidAndAddr = (cli: { stderr: string }, addr: string) => cli.stderr
    .replace(/SEVM \d+:/g, 'SEVM <pid>:')
    .replace(new RegExp("'.*" + addr + ".*'", 'g'), '<addr>');

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

    it("should display users' config path using `config`", function () {
        const cli = chaiExec(sevm, ['config']);

        expect(cli.stdout.trim()).to.match(/[\/\\]sevm-nodejs/, `${cli.stdout} does not match in \`[/\\]sevm-nodejs\``);
        expect(cli).stderr.to.be.empty;
        expect(cli).to.exit.with.code(0);
    });

    it('should display `metadata` from JSON `bytecode`', function () {
        const input = `{
            "bytecode": "60806040525f80fdfea2646970667358221220213295e11660e0fa1851b6245c99f6d8ef0d1ad319b69a6483694b3a316c2dc564736f6c63430008150033",
            "abi": []
        }`;
        const cli = chaiExec(sevm, ['metadata', '-', '--no-color', '--no-patch'], { input });

        expect(cli.stdout).to.matchSnapshot('out', this);
        expect(cli).stderr.to.be.empty;
        expect(cli).to.exit.with.code(0);
    });

    it('should display no-`metadata` from `bytecode`', function () {
        const input = '60806040525f80fdfe';
        const cli = chaiExec(sevm, ['metadata', '-', '--no-color', '--no-patch'], { input });

        expect(cli.stdout).to.matchSnapshot('out', this);
        expect(cli).stderr.to.be.empty;
        expect(cli).to.exit.with.code(0);
    });

    ['abi', 'selectors', 'cfg', 'sol', 'yul', 'sol --reduce', 'yul --reduce']
        .forEach(args =>
            it(`should display \`${args}\` from \`bytecode\``, function () {
                const input = '6080604052348015600f57600080fd5b506004361060285760003560e01c80636d4ce63c14602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000600590509056fe';
                const [cmd, ...flags] = args.split(' ');
                const cli = chaiExec(sevm, [cmd, '-', ...flags, '--no-color', '--no-patch'], { input });

                expect(cli.stdout).to.matchSnapshot('out', this);
                expect(cli).stderr.to.be.empty;
                expect(cli).to.exit.with.code(0);
            })
        );

    it('should run `dis` command and find non-reacheable chunk', function () {
        const input = '0x6001600201600c56010203045b62fffefd5b00';
        const cli = chaiExec(sevm, ['dis', '-', '--no-color', '--no-patch'], { input });

        expect(cli.stdout).to.matchSnapshot('out', this);
        expect(cli).stderr.to.be.empty;
        expect(cli).to.exit.with.code(0);
    });

    it('should catch error when input is not a valid hex string', function () {
        const cli = chaiExec(sevm, ['dis', '-', '--no-color'], { input: '0x0011ax' });

        expect(cli.stdout).to.be.empty;
        expect(cli).stderr.to.matchSnapshot('err', this);
        expect(cli).to.exit.with.code(1);
    });

    it('should log debug trace when `NODE_DEBUG=sevm` is set', function () {
        // address doesn't checksum, this is to avoid CLI making a request,
        // thus making the test more robust
        const cli = chaiExec(sevm, ['metadata', '0x8Ba1f109551bD432803012645Ac136ddd64DBa72'], { env: sevmDebugEnv });

        expect(cli.stdout).to.be.empty;
        expect(maskStderrPidAndAddr(cli, '0x8Ba1f109551bD432803012645Ac136ddd64DBa72')).to.matchSnapshot('err', this);
        expect(cli).to.exit.with.code(2);
    });

    it('should fail to fetch to bytecode because of invalid Ethereum address', function () {
        const cli = chaiExec(sevm, ['metadata', '0x8ba1'], { env: sevmDebugEnv });

        expect(cli.stdout).to.be.empty;
        expect(maskStderrPidAndAddr(cli, '0x8ba1')).to.matchSnapshot('err', this);
        expect(cli).to.exit.with.code(2);
    });

    it('should catch error when exec self-destructed contract', function () {
        const cli = chaiExec(sevm, ['metadata', '-', '--no-color'], { input: '0x' });

        expect(cli.stdout).to.be.empty;
        expect(cli).stderr.to.matchSnapshot('err', this);
        expect(cli).to.exit.with.code(3);
    });

    describe(`::bin/provider`, function () {
        /**
         * Beacon Deposit Contract
         * https://etherscan.io/address/0x00000000219ab540356cBB839Cbe05303d7705Fa
         */
        const address = '0x00000000219ab540356cBB839Cbe05303d7705Fa';
        const mock = '--import=./scripts/mock.mjs';

        it('should get `bytecode` from default provider', function () {
            const cli = chaiExec('node', [mock, sevm, 'abi', address, '--no-color', '--no-patch', '--no-cache'], { env: sevmDebugEnv });

            expect(maskStderrPidAndAddr(cli, address)).to.matchSnapshot('err', this);
            expect(cli.stdout).to.matchSnapshot('out', this);
            expect(cli).to.exit.with.code(0);
        });

        it('should get `bytecode` from default provider with lowercase address', function () {
            const cli = chaiExec('node', [mock, sevm, 'abi', address.toLowerCase(), '--no-color', '--no-patch', '--no-cache'], { env: sevmDebugEnv });

            expect(maskStderrPidAndAddr(cli, address.toLowerCase())).to.matchSnapshot('err', this);
            expect(cli.stdout).to.matchSnapshot('out', this);
            expect(cli).to.exit.with.code(0);
        });

        it('should get `bytecode` from default provider and `patch` method signatures', function () {
            const cli = chaiExec('node', [mock, sevm, 'abi', address, '--no-color', '--no-cache'], { env: sevmDebugEnv });

            expect(maskStderrPidAndAddr(cli, address)).to.matchSnapshot('err', this);
            expect(cli.stdout).to.matchSnapshot('out', this);
            expect(cli).to.exit.with.code(0);
        });

        it('should get `bytecode` from `SEVM_RPC_URL` provider', function () {
            const cli = chaiExec('node', [mock, sevm, 'abi', address, '--no-color', '--no-patch', '--no-cache'], {
                env: { ...sevmDebugEnv, SEVM_RPC_URL: 'http://some-rpc-provider' }
            });

            expect(maskStderrPidAndAddr(cli, address)).to.matchSnapshot('err', this);
            expect(cli.stdout).to.matchSnapshot('out', this);
            expect(cli).to.exit.with.code(0);
        });

        it('should not get `bytecode` when provider is invalid', function () {
            const cli = chaiExec('node', [mock, sevm, 'abi', address, '--no-color', '--no-patch', '--no-cache'], {
                env: { ...sevmDebugEnv, SEVM_RPC_URL: 'error://some-rpc-provider' }
            });

            expect(maskStderrPidAndAddr(cli, address)).to.matchSnapshot('err', this);
            expect(cli.stdout).to.matchSnapshot('out', this);
            expect(cli).to.exit.with.code(2);
        });
    });
});

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

        expect(cli.stdout.trim()).to.match(/sevm-nodejs$/, `${cli.stdout} does not end in \`sevm-nodejs\``);
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

    it('should display `abi` from `bytecode`', function () {
        const input = '6080604052348015600f57600080fd5b506004361060285760003560e01c80636d4ce63c14602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000600590509056fe';
        const cli = chaiExec(sevm, ['abi', '-', '--no-color', '--no-patch'], { input });

        expect(cli.stdout).to.matchSnapshot('out', this);
        expect(cli).stderr.to.be.empty;
        expect(cli).to.exit.with.code(0);
    });

    it('should display `selectors` from `bytecode`', function () {
        const input = '6080604052348015600f57600080fd5b506004361060285760003560e01c80636d4ce63c14602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000600590509056fe';
        const cli = chaiExec(sevm, ['selectors', '-', '--no-color', '--no-patch'], { input });

        expect(cli.stdout).to.matchSnapshot('out', this);
        expect(cli).stderr.to.be.empty;
        expect(cli).to.exit.with.code(0);
    });

    it('should run `dis` command and find non-reacheable chunk', function () {
        const input = '0x6001600201600c56010203045b62fffefd5b00';
        const cli = chaiExec(sevm, ['dis', '-', '--no-color', '--no-patch'], { input });

        expect(cli.stdout).to.matchSnapshot('out', this);
        expect(cli).stderr.to.be.empty;
        expect(cli).to.exit.with.code(0);
    });

    it('should display `cfg` from `bytecode`', function () {
        const input = '6080604052348015600f57600080fd5b506004361060285760003560e01c80636d4ce63c14602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000600590509056fe';
        const cli = chaiExec(sevm, ['cfg', '-', '--no-color', '--no-patch'], { input });

        expect(cli.stdout).to.matchSnapshot('out', this);
        expect(cli).stderr.to.be.empty;
        expect(cli).to.exit.with.code(0);
    });

    it('should display `sol` from `bytecode`', function () {
        const input = '6080604052348015600f57600080fd5b506004361060285760003560e01c80636d4ce63c14602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000600590509056fe';
        const cli = chaiExec(sevm, ['sol', '-', '--no-color', '--no-patch'], { input });

        expect(cli.stdout).to.matchSnapshot('out', this);
        expect(cli).stderr.to.be.empty;
        expect(cli).to.exit.with.code(0);
    });

    it('should display `yul` from `bytecode`', function () {
        const input = '6080604052348015600f57600080fd5b506004361060285760003560e01c80636d4ce63c14602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000600590509056fe';
        const cli = chaiExec(sevm, ['yul', '-', '--no-color', '--no-patch'], { input });

        expect(cli.stdout).to.matchSnapshot('out', this);
        expect(cli).stderr.to.be.empty;
        expect(cli).to.exit.with.code(0);
    });

    it('should display `sol --reduce` from `bytecode`', function () {
        const input = '6080604052348015600f57600080fd5b506004361060285760003560e01c80636d4ce63c14602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000600590509056fe';
        const cli = chaiExec(sevm, ['sol', '-', '--reduce', '--no-color', '--no-patch'], { input });

        expect(cli.stdout).to.matchSnapshot('out', this);
        expect(cli).stderr.to.be.empty;
        expect(cli).to.exit.with.code(0);
    });

    it('should display `yul --reduce` from `bytecode`', function () {
        const input = '6080604052348015600f57600080fd5b506004361060285760003560e01c80636d4ce63c14602d575b600080fd5b60336049565b6040518082815260200191505060405180910390f35b6000600590509056fe';
        const cli = chaiExec(sevm, ['yul', '-', '--reduce', '--no-color', '--no-patch'], { input });

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

    const ENABLE_BIN_PROVIDER_TEST = process.env['ENABLE_BIN_PROVIDER_TEST'];
    const hint = !ENABLE_BIN_PROVIDER_TEST ? ' (enable it by setting `ENABLE_BIN_PROVIDER_TEST`)' : '';

    describe(`::bin/provider ENABLE_BIN_PROVIDER_TEST=${ENABLE_BIN_PROVIDER_TEST}${hint}`, function () {
        /**
         * Beacon Deposit Contract
         * https://etherscan.io/address/0x00000000219ab540356cBB839Cbe05303d7705Fa
         */
        const address = '0x00000000219ab540356cBB839Cbe05303d7705Fa';

        it('should get `bytecode` from default provider', function () {
            if (!ENABLE_BIN_PROVIDER_TEST) this.skip();

            const cli = chaiExec(sevm, ['abi', address, '--no-color', '--no-patch', '--no-cache'], { env: sevmDebugEnv });

            expect(maskStderrPidAndAddr(cli, address)).to.matchSnapshot('err', this);
            expect(cli.stdout).to.matchSnapshot('out', this);
            expect(cli).to.exit.with.code(0);
        });

        it('should get `bytecode` from default provider and `patch` method signatures', function () {
            if (!ENABLE_BIN_PROVIDER_TEST) this.skip();

            const cli = chaiExec(sevm, ['abi', address, '--no-color', '--no-cache'], { env: sevmDebugEnv });

            expect(maskStderrPidAndAddr(cli, address)).to.matchSnapshot('err', this);
            expect(cli.stdout).to.matchSnapshot('out', this);
            expect(cli).to.exit.with.code(0);
        });
    });
});

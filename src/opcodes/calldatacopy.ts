export class CALLDATACOPY {
    readonly name = 'CALLDATACOPY';
    readonly type?: string;
    readonly wrapped: boolean = true;

    constructor(readonly startLocation: any, readonly copyLength: any) {}

    toString() {
        return `msg.data[${this.startLocation}:(${this.startLocation}+${this.copyLength})];`;
    }
}

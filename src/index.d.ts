
import {} from 'sevm';

declare module 'sevm' {
    interface Contract {
        patch(): this;
    }
}

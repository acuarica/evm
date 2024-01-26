# Guide

## Get public functions and events

Use methods `getFunctions` and `getEvents` to get functions and events respectively.

```typescript
import { Contract } from 'sevm';
import 'sevm/4bytedb';

const contract = new Contract(bytecode).patchdb();
console.log(contract.getFunctions());
console.log(contract.getEvents());
```

# Guide

## Get public functions and events

Use methods `getFunctions` and `getEvents` to get functions and events respectively.

```typescript
import { Contract } from '@acuarica/evm';
import '@acuarica/evm/selector';

const contract = new Contract(bytecode).patch();
console.log(contract.getFunctions());
console.log(contract.getEvents());
```

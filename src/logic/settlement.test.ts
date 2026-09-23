import { describe, expect, it } from 'vitest';
import { suggestTransfers } from './settlement';
describe('settlement suggestions', () => { it('matches every debt to a winner', () => expect(suggestTransfers([{ id:'a', name:'Anna', amount:20 }, { id:'b', name:'Ben', amount:-15 }, { id:'c', name:'Chris', amount:-5 }])).toEqual([{ from:'Ben', to:'Anna', amount:15 }, { from:'Chris', to:'Anna', amount:5 }])); });

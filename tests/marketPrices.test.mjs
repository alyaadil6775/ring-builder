import test from 'node:test';
import assert from 'node:assert/strict';
import {priceDesign} from '../src/pricing.js';
import {initialConfig} from '../src/designStorage.js';
import {alloyDensity} from '../src/alloys.js';
import {marketPrices,spotPerGram,GRAMS_PER_TROY_OUNCE} from '../src/marketPrices.js';
test('spot ounce conversion, purity and modeled grams determine metal cost',()=>{
 assert.equal(spotPerGram('gold'),4134/31.1034768);
 for(const [metal,karat,commodity,purity] of [['Yellow gold',14,'gold',.585],['Rose gold',18,'gold',.75],['White gold',10,'gold',.417],['Platinum',14,'platinum',.95],['Sterling silver',14,'silver',.925],['Gold-plated sterling silver',14,'silver',.925]]){
  const config={...initialConfig(),band:'Rounded',metal,karat};
  const q=priceDesign(config,{volumeMm3:5000/alloyDensity(config)});
  const expected=5*marketPrices.usdPerTroyOunce[commodity]/GRAMS_PER_TROY_OUNCE*purity;
  assert.ok(Math.abs(q.lines[0].amount-expected)<1e-9);
  assert.ok(Math.abs(q.total-(expected+400))<1e-9);
  assert.equal(q.marketPrices.date,'2026-10-08');
 }
});

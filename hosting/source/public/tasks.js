import {additionalTasks} from './additional-tasks.js';
import {repositoryTask} from './repository-task.js';
export const tasks = [
 {id:'invoice',title:'The disappearing invoice',area:'Data integrity',level:'01',minutes:'15–25 min',file:'invoice.js',skill:'Truthiness vs. missing data',brief:'A billing export drops valid invoices with a zero balance. Repair the filter without allowing missing balances into the export.',contract:'Keep finite numeric balances, including 0. Exclude null, undefined, NaN, and non-numeric values. Preserve the original records and their order.',code:`function exportInvoices(invoices) {
  return invoices.filter(invoice => invoice.balance);
}`,entry:'exportInvoices',tests:[{name:'Positive balances stay',args:[[{id:'a',balance:25}]],expected:[{id:'a',balance:25}]},{name:'Zero is a valid balance',args:[[{id:'paid',balance:0}]],expected:[{id:'paid',balance:0}]},{name:'Missing and invalid balances stay out',args:[[{id:'a',balance:null},{id:'b'},{id:'c',balance:'12'},{id:'d',balance:NaN},{id:'e',balance:-5}]],expected:[{id:'e',balance:-5}]}],question:'Which values count as false in JavaScript? Which of those are still valid balances?',next:'inventory'},
 {id:'inventory',title:'An empty shelf is still a shelf',area:'Transfer challenge',level:'02',minutes:'10–15 min',file:'inventory.js',skill:'Independent transfer',transfer:true,brief:'An inventory report loses out-of-stock products. Apply what you learned to an unfamiliar function, without coaching.',contract:'Return the names of products whose stock is a finite number, including zero and negative adjustments. Reject missing, string, NaN, or infinite stock values.',code:`function stockReport(products) {
  return products.filter(product => product.stock)
    .map(product => product.name);
}`,entry:'stockReport',tests:[{name:'Ordinary stock',args:[[{name:'Notebook',stock:4}]],expected:['Notebook']},{name:'Out-of-stock products are retained',args:[[{name:'Pencil',stock:0},{name:'Pen',stock:-1}]],expected:['Pencil','Pen']},{name:'Invalid stock is excluded',args:[[{name:'A',stock:null},{name:'B',stock:'3'},{name:'C',stock:NaN},{name:'D',stock:Infinity},{name:'E',stock:2}]],expected:['E']}],next:'batch'},
 {id:'batch',title:'The final batch never arrives',area:'Boundary conditions',level:'03',minutes:'15–25 min',file:'batches.js',skill:'Boundary conditions',brief:'A background job processes records in batches. Some records vanish when the final batch is incomplete. Fix the implementation.',contract:'For a positive integer size, return all records in consecutive batches of at most size. Empty input returns []. Invalid sizes must throw an Error. Do not mutate the input.',code:`function makeBatches(records, size) {
  const batches = [];
  for (let i = 0; i + size <= records.length; i += size) {
    batches.push(records.slice(i, i + size));
  }
  return batches;
}`,entry:'makeBatches',tests:[{name:'Complete batches',args:[[1,2,3,4],2],expected:[[1,2],[3,4]]},{name:'Incomplete final batch',args:[[1,2,3],2],expected:[[1,2],[3]]},{name:'Input smaller than a batch',args:[[1],3],expected:[[1]]},{name:'Empty input',args:[[],2],expected:[]},{name:'Zero size is rejected',args:[[1],0],throws:true},{name:'Fractional size is rejected',args:[[1],1.5],throws:true}],question:'Trace the loop condition for three records and a batch size of two. Does the last record ever enter the loop?',next:'url-join-fragment'},
 {...repositoryTask,next:'debounce-rejection'},
 ...additionalTasks
];
export const provenance={kind:'Original authored training fixtures',license:'MIT',source:'FixFirst project source, public release pending',limitations:'These are small maintenance-style exercises, not imported production bugs or validated hiring assessments. Test cases are visible in the client and are not a secret assessment.'};

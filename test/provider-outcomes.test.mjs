import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {runResponses} from '../server/responses.mjs';

test('provider failures and truncated tool calls cannot report success or execute actions', async () => {
  let reply, requests = 0, actions = 0;
  const server = http.createServer(async (req, res) => {
    for await (const chunk of req) { /* consume request */ }
    requests++;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(reply));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const messages = [];
  const context = {
    run: {model:'fixture', reasoning:'low', maxOutput:100, maxSteps:2, contextLimit:10000},
    provider: {protocol:'responses', url:`http://127.0.0.1:${server.address().port}`},
    key:'', signal:new AbortController().signal, emit:()=>{}, approve:async()=>true,
    history:[{role:'user', content:'Create a report'}], connectors:[], usage:()=>{},
    message: text => messages.push(text), executeTool:async()=>{ actions++; return {}; }
  };
  try {
    reply = {status:'failed', output:[]};
    await assert.rejects(runResponses(context), /did not complete/);
    reply = {status:'completed', output:[]};
    await assert.rejects(runResponses(context), /no output/);
    reply = {status:'incomplete', output:[
      {type:'message', id:'partial', content:[{type:'output_text', text:'Partial report'}]},
      {type:'function_call', call_id:'unfinished', name:'create_artifact', arguments:'{}'}
    ]};
    await assert.rejects(runResponses(context), /incomplete/);
    assert.deepEqual(messages, ['Partial report']);
    context.provider.protocol = 'chat';
    reply = {choices:[{finish_reason:'length', message:{content:'Partial', tool_calls:[
      {id:'unfinished', function:{name:'create_artifact', arguments:'{}'}}
    ]}}]};
    await assert.rejects(runResponses(context), /Output limit/);
    reply = {choices:[{finish_reason:'content_filter', message:{content:null}}]};
    await assert.rejects(runResponses(context), /filtered/);
    assert.equal(actions, 0);
    const before = requests;
    context.agent = {instructions:'Long instruction '.repeat(3000)};
    await assert.rejects(runResponses(context), /Context limit/);
    assert.equal(requests, before, 'Oversized instructions must be rejected before provider spend');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});

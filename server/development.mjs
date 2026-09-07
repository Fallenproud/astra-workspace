// Deterministic, network-free adapter for exercising the actual control-plane lifecycle.
export async function runDevelopment(ctx) {
  ctx.emit('simulation_started', {simulated:true, network:false, billing:false});
  ctx.message('Development simulation — no model, network request, or API key is used. I will request approval to save a local test artifact.');
  const content = '# Astra development artifact\n\nSIMULATED OUTPUT — not AI-generated.\n\nTask:\n'+ctx.run.prompt+'\n\nConversation messages available: '+ctx.history.length+'\n';
  const result = await ctx.executeTool('create_artifact', JSON.stringify({name:'development-result.md',content}));
  ctx.message(result.error
    ? 'Development simulation finished without an artifact: '+result.error
    : 'Development simulation complete. The approved local artifact and execution history are persisted. Continue this conversation to test retained context.');
  ctx.emit('simulation_completed', {simulated:true, artifactId:result.id||null});
}

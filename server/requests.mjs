// Keep protocol-specific server requests beneath Astra's approval boundary.
export async function handleBackendRequest({ approve, emit }, request) {
  const { method, params } = request;
  if (['item/commandExecution/requestApproval', 'item/fileChange/requestApproval'].includes(method)) {
    return { decision: (await approve(method, params)) ? 'accept' : 'decline' };
  }
  if (method === 'item/permissions/requestApproval') {
    return { permissions: (await approve(method, params)) ? params.permissions : {}, scope: 'turn' };
  }
  if (['item/tool/requestUserInput', 'tool/requestUserInput'].includes(method)) {
    return { answers: await approve('user_input', params) };
  }
  if (method === 'mcpServer/elicitation/request' && params.mode === 'url') {
    return { action: (await approve('mcp_url_elicitation', params)) ? 'accept' : 'decline', content: null };
  }
  emit('unsupported_request', { method, message: 'This backend interaction is not supported.' });
  // Do not send an invalid decision-shaped success response to an unknown method.
  throw new Error('Unsupported backend request: ' + method);
}

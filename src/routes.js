export const workspaceViews=['Home','Projects','Runs','Artifacts','Skills','Workflows','Integrations','Settings'];
export function workspaceView(path=location.pathname,hash=location.hash){
 const legacy=decodeURIComponent(hash.slice(1));if(workspaceViews.includes(legacy))return legacy;
 return workspaceViews.find(v=>v.toLowerCase()===path.split('/')[2])||'Home';
}
export const workspacePath=view=>'/workspace'+(view==='Home'?'':'/'+view.toLowerCase());

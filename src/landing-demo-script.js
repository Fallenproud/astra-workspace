// Canonical landing demonstration. Presentation-only fixtures; never call workspace APIs.
export const demoScript = Object.freeze({
 task: 'Create a launch brief from my project notes.',
 project: 'Product launch',
 file: 'project-notes.md',
 stages: [
  {label:'Reading project context',detail:'Reviewing the example project notes.',duration:1100},
  {label:'Planning the brief',detail:'Organizing the audience, message, and next steps.',duration:1300},
  {label:'Creating the artifact',detail:'Drafting a concise launch brief.',duration:1500},
  {label:'Ready to review',detail:'launch-brief.md is ready in Artifacts.',duration:0}
 ],
 artifact: '# Product launch brief\n\nAudience: teams bringing their AI work into one persistent workspace.\n\nMessage: connect models, provide context, and keep the work together.\n\nNext steps:\n1. Review the project scope.\n2. Prepare the launch materials.\n3. Share the approved brief.\n\nIllustrative demo content only.'
});
export const demoViews=['Home','Projects','Runs','Artifacts','Skills','Workflows','Integrations','Settings'];

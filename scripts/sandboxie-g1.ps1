param([string]$Installation = 'C:\Program Files\Sandboxie-Plus',[ValidateSet('g1','exit-tests')][string]$Mode='g1',[ValidateSet('all','exit0','exit1','exit23','missing','timeout','cancelled')][string]$ExitCase='all')
$ErrorActionPreference = 'Stop'
$runId = 'g1-' + [guid]::NewGuid().ToString('N').Substring(0,12)
$box = 'AstraG1_' + $runId.Substring(3)
$root = Join-Path 'D:\AstraRuntimeCanary' $runId
$workspace = Join-Path $root 'workspace'
$protected = Join-Path $root 'protected'
$boxRoot = Join-Path $root 'box'
$evidence = Join-Path $PSScriptRoot ('..\work\runtime-readiness\' + $runId)
New-Item -ItemType Directory -Path $workspace,$protected,$evidence -Force | Out-Null
$evidence = (Resolve-Path $evidence).Path
$ini = Join-Path $Installation 'SbieIni.exe'
$start = Join-Path $Installation 'Start.exe'
$receipt = [ordered]@{runId=$runId;gate='G1';result='blocked';box=$box;profile='astra-code-canary';workspace=$workspace;boxRoot=$boxRoot;startedAt=(Get-Date).ToUniversalTime().ToString('o');checks=[ordered]@{};cleanup='not_started';commands=@()}
$receipt.installation=@{path=$Installation;plusVersion=(Get-Item (Join-Path $Installation 'SandMan.exe')).VersionInfo.FileVersion;coreVersion=(Get-Item $start).VersionInfo.FileVersion;service=[string](Get-Service SbieSvc).Status;driver=[string](Get-Service SbieDrv).Status}
function Save-Receipt { $receipt | ConvertTo-Json -Depth 12 | Set-Content (Join-Path $evidence 'receipt.json') }
function Invoke-Cli([string]$exe,[string[]]$arguments,[int]$timeout=30,[bool]$AllowNonZero=$false) {
  $info = [Diagnostics.ProcessStartInfo]::new($exe)
  $info.UseShellExecute=$false; $info.CreateNoWindow=$true
  $info.RedirectStandardOutput=$true; $info.RedirectStandardError=$true
  foreach($argument in $arguments){[void]$info.ArgumentList.Add($argument)}
  # The fixed canary needs no inherited credentials or developer configuration.
  $info.Environment.Clear()
  foreach($name in @('SystemRoot','WINDIR','SystemDrive','COMSPEC','PATH','TEMP','TMP','USERPROFILE','USERNAME','USERDOMAIN','APPDATA','LOCALAPPDATA','ProgramData','ProgramFiles','ProgramFiles(x86)')){
    $value=[Environment]::GetEnvironmentVariable($name);if($value){$info.Environment[$name]=$value}
  }
  $process=[Diagnostics.Process]::Start($info)
  $outTask=$process.StandardOutput.ReadToEndAsync();$errTask=$process.StandardError.ReadToEndAsync()
  if(!$process.WaitForExit($timeout*1000)){
    $process.Kill($true);$process.WaitForExit()
    $receipt.commands+=@{exe=$exe;arguments=$arguments;pid=$process.Id;exitCode=$process.ExitCode;childExitCode=$null;status='timeout';terminationReason='launcher_timeout';stdout=$outTask.GetAwaiter().GetResult();stderr=$errTask.GetAwaiter().GetResult()};Save-Receipt
    throw "CLI timeout: $exe"
  }
  $result=@{exe=$exe;arguments=$arguments;pid=$process.Id;exitCode=$process.ExitCode;stdout=$outTask.GetAwaiter().GetResult();stderr=$errTask.GetAwaiter().GetResult()}
  $receipt.commands+= $result;Save-Receipt
  if($result.exitCode -ne 0 -and !$AllowNonZero){throw "CLI failed ($($result.exitCode)): $exe $arguments"}
  return $result
}
function Set-Box([string]$key,[string]$value,[string]$operation='set') { [void](Invoke-Cli $ini @($operation,$box,$key,$value)) }
function Assert-Check([string]$name,[bool]$passed) { $receipt.checks[$name]=$passed;Save-Receipt;if(!$passed){throw "Verification failed: $name"} }
function Read-Section([string]$section) {
  $names=(Invoke-Cli $ini @('query',$section)).stdout.Trim()
  $lines=@()
  if($names){foreach($key in ($names -split '\r?\n')){
    $values=(Invoke-Cli $ini @('query',$section,$key)).stdout.Trim()
    foreach($value in ($values -split '\r?\n')){$lines+=($key+'='+$value)}
  }}
  return ($lines -join "`n")
}
$before=@(& $ini query '*');$before | Set-Content (Join-Path $evidence 'sections-before.txt')
if($before -contains $box){throw 'Refusing to reuse an existing sandbox'}
foreach($section in $before){ [IO.File]::WriteAllText((Join-Path $evidence ('before-'+$section+'.txt')),[string](Read-Section $section)) }
Set-Content (Join-Path $workspace 'answer.js') 'console.log(41);' -Encoding ascii
Set-Content (Join-Path $protected 'sentinel.txt') 'ASTRA_HOST_PROTECTED' -Encoding ascii
$beforeHash=(Get-FileHash (Join-Path $protected 'sentinel.txt')).Hash
$receipt.hostBoundary=@{path=(Join-Path $protected 'sentinel.txt');beforeSha256=$beforeHash}
@'
@echo off
echo ASTRA_STDERR_CAPTURE_CANARY 1>&2
C:\Windows\System32\findstr.exe /L /C:"console.log(42);" "%~dp0answer.js"
exit /b %errorlevel%
'@ | Set-Content (Join-Path $workspace 'check.cmd') -Encoding ascii
Copy-Item (Join-Path $workspace 'check.cmd') $evidence
foreach($support in @('astra-child-process.ps1','sandboxie-command-wrapper.ps1')){Copy-Item (Join-Path $PSScriptRoot $support) $workspace;Copy-Item (Join-Path $PSScriptRoot $support) $evidence}
@'
param([string]$Workspace,[string]$Protected)
$ErrorActionPreference='Stop'
. (Join-Path $Workspace 'astra-child-process.ps1')
try {
  $source=Join-Path $Workspace 'answer.js'
  if((Get-Content -Raw $source).Trim() -ne 'console.log(41);'){throw 'Input mismatch'}
  Set-Content $source 'console.log(42);' -Encoding ascii
  Set-Content (Join-Path $Workspace 'created.txt') 'ASTRA_CREATED_IN_SANDBOX' -Encoding ascii
  $check=Invoke-AstraChildProcess -Executable 'C:\Windows\System32\cmd.exe' -Arguments @('/d','/c',(Join-Path $Workspace 'check.cmd')) -Cwd $Workspace
  $check|ConvertTo-Json -Depth 8|Set-Content (Join-Path $Workspace 'command-result.json')
  [IO.File]::WriteAllText((Join-Path $Workspace 'check.stdout.txt'),$check.stdout)
  [IO.File]::WriteAllText((Join-Path $Workspace 'check.stderr.txt'),$check.stderr)
  $checkExit=$check.childExitCode
  if($check.status -ne 'exited'){throw ('Command did not exit normally: '+$check.status)}
  if($null -eq $checkExit){throw 'Missing command exit code'}
  if($checkExit -ne 0){exit $checkExit}
  $denied=$false
  $denialError=''
  try { [IO.File]::WriteAllText((Join-Path $Protected 'sentinel.txt'),'UNAUTHORIZED_CHANGE') } catch { $denied=$true;$denialError=$_.Exception.Message }
  $injected=@((Get-Process -Id $PID).Modules | Where-Object ModuleName -eq 'SbieDll.dll').Count -gt 0
  @{pid=$PID;readVerified=$true;checkPid=$check.childPid;checkExitCode=$checkExit;shellExitCode=0;protectedWriteDenied=$denied;denialError=$denialError;sbieDllLoaded=$injected} | ConvertTo-Json | Set-Content (Join-Path $Workspace 'child-result.json')
  if(!$denied -or !$injected){throw 'Isolation assertion failed'}
  exit 0
} catch {
  $_ | Out-String | Set-Content (Join-Path $Workspace 'failure.txt')
  exit 23
}
'@ | Set-Content (Join-Path $workspace 'canary.ps1') -Encoding ascii
Copy-Item (Join-Path $workspace 'canary.ps1') $evidence
Save-Receipt
try {
  foreach($name in @('SbieSvc','SbieDrv')){Assert-Check ($name+'Running') ((Get-Service $name).Status -eq 'Running')}
  Set-Box 'Enabled' 'y'
  Set-Box 'FileRootPath' $boxRoot
  Set-Box 'DropAdminRights' 'y'
  Set-Box 'AutoRecover' 'n'
  Set-Box 'AutoDelete' 'n'
  Set-Box 'BlockNetworkFiles' 'y'
  foreach($path in @($protected,'C:\Users\mrlyd\.codex','C:\Users\mrlyd\.ssh','\Device\RawIp','\Device\Ip*','\Device\Tcp*','\Device\Afd*')) { Set-Box 'ClosedFilePath' $path 'append' }
  # Official auto-detected compatibility templates are global. Record them and
  # close their IPC/pipe exceptions in this dedicated box, without editing globals.
  $globalProfile=Read-Section 'GlobalSettings'
  $globalProfile | Set-Content (Join-Path $evidence 'global-profile.txt')
  $knownTemplates=@('WindowsRasMan','OnScreenKeyboard','NotepadPlusPlus_fix','WindowsLive','Edge_Fix','OfficeLicensing','OfficeClickToRun')
  $templateSource=[IO.File]::ReadAllText((Join-Path $Installation 'Templates.ini'))
  foreach($line in ($globalProfile -split '\r?\n')){
    if($line.StartsWith('Template=')){
      $template=$line.Substring(9)
      Assert-Check ('knownCompatibilityTemplate_'+$template) ($knownTemplates -contains $template)
      $definition=[regex]::Match($templateSource,'(?ms)^\[Template_'+[regex]::Escape($template)+'\]\r*\n.*?(?=^\[|\z)').Value
      Assert-Check ('templateDefinitionPresent_'+$template) (![string]::IsNullOrWhiteSpace($definition))
      $definition | Set-Content (Join-Path $evidence ('template-'+$template+'.txt'))
      foreach($entry in ($definition -split '\r*\n')){
        if($entry.StartsWith('OpenIpcPath=')){Set-Box 'ClosedIpcPath' $entry.Substring(12) 'append'}
        if($entry.StartsWith('OpenFilePath=')){Set-Box 'ClosedFilePath' $entry.Substring(13) 'append'}
      }
    }
  }
  [void](Invoke-Cli $start @('/reload'))
  $profile=Read-Section $box
  $profile | Set-Content (Join-Path $evidence 'profile.txt')
  $globalProfile=Read-Section 'GlobalSettings'
  Assert-Check 'noIsolationBypassConfigured' (($profile+"`n"+$globalProfile) -notmatch '(?im)^(OpenFilePath|OpenPipePath|OpenIpcPath|NoSecurityIsolation|NoSecurityFiltering|AppCompartment)=')
  Assert-Check 'profileDropRightsEnforced' ($profile -match '(?m)^DropAdminRights=y$')
  Assert-Check 'profileHostFixtureBlocked' ($profile.Contains('ClosedFilePath='+$protected))
  $shadow=Join-Path $boxRoot ('drive\D\'+$workspace.Substring(3))
  if($Mode -eq 'exit-tests'){
    $receipt.kind='exit-code-integration-tests';$receipt.exitTests=@()
    $shell='C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe'
    foreach($case in @('exit0','exit1','exit23','missing','timeout','cancelled')){
      if($ExitCase -ne 'all' -and $ExitCase -ne $case){continue}
      $expected=switch($case){'exit0'{0};'exit1'{1};'exit23'{23};default{$null}}
      $caseScript=Join-Path $workspace ($case+'.ps1')
      $caseBody="[Console]::Out.WriteLine('ASTRA_OUT_$case'); [Console]::Error.WriteLine('ASTRA_ERR_$case'); "
      if($null -ne $expected){$caseBody+='exit '+$expected}else{$caseBody+='Start-Sleep -Seconds 30; exit 0'}
      $caseBody|Set-Content $caseScript -Encoding ascii
      $request=@{id=$case;executable=$shell;arguments=@('-NoLogo','-NoProfile','-NonInteractive','-File',$caseScript);timeoutMs=10000;cancelAfterMs=0}
      if($case -eq 'exit0'){$request.legacyProbe=$true}
      if($case -eq 'missing'){$request.executable=Join-Path $workspace 'does-not-exist.exe';$request.arguments=@()}
      if($case -eq 'timeout'){$request.timeoutMs=1200}
      if($case -eq 'cancelled'){$request.cancelAfterMs=1200}
      $requestPath=Join-Path $workspace ($case+'.request.json');$request|ConvertTo-Json|Set-Content $requestPath
      Copy-Item $requestPath $evidence;Copy-Item $caseScript $evidence
      $launchedAt=[DateTime]::UtcNow.ToString('o')
      $launch=Invoke-Cli $start @('/silent',('/box:'+$box),'/wait','/hide_window',$shell,'-NoLogo','-NoProfile','-NonInteractive','-File',(Join-Path $workspace 'sandboxie-command-wrapper.ps1'),'-RequestPath',$requestPath) 30 $true
      $resultPath=Join-Path $shadow ($case+'.result.json');Copy-Item $resultPath $evidence
      $child=Get-Content -Raw $resultPath|ConvertFrom-Json
      $record=[ordered]@{case=$case;command=$request;box=$box;profile=$receipt.profile;launcherPid=$launch.pid;shellPid=$child.shellPid;childPid=$child.childPid;startedAt=$launchedAt;endedAt=[DateTime]::UtcNow.ToString('o');stdout=$child.stdout;stderr=$child.stderr;launcherExitCode=$launch.exitCode;shellExitCode=$child.shellExitCode;childExitCode=$child.childExitCode;astraRecordedExitCode=$child.childExitCode;normalizedResult=$child.status;terminationReason=$child.terminationReason;error=$child.error}
      $receipt.exitTests+=$record;Save-Receipt
      Assert-Check ($case+'_structuredResult') ($child.requestId -eq $case -and $child.sbieDllLoaded)
      Assert-Check ($case+'_launcherShellMatch') ($launch.exitCode -eq $child.shellExitCode)
      if($null -ne $expected){
        Assert-Check ($case+'_exactExit') ($child.status -eq 'exited' -and $child.childExitCode -eq $expected -and $child.shellExitCode -eq $expected)
        Assert-Check ($case+'_stdout') ($child.stdout.Trim() -eq ('ASTRA_OUT_'+$case))
        Assert-Check ($case+'_stderr') ($child.stderr.Trim() -eq ('ASTRA_ERR_'+$case))
      }else{
        $state=if($case -eq 'missing'){'launch_failed'}else{$case}
        Assert-Check ($case+'_explicitResult') ($child.status -eq $state)
        if($case -eq 'missing'){Assert-Check 'launchFailureHasNoChildExit' ($null -eq $child.childExitCode -and $null -eq $child.childPid)}
      }
    }
  }else{
  $execution=Invoke-Cli $start @('/silent',('/box:'+$box),'/wait','/hide_window','C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe','-NoLogo','-NoProfile','-NonInteractive','-File',(Join-Path $workspace 'canary.ps1'),'-Workspace',$workspace,'-Protected',$protected) 60
  # Inspect physical redirected output from the unsandboxed verifier, not model prose.
  $shadow=Join-Path $boxRoot ('drive\D\'+$workspace.Substring(3))
  $receipt.shadowWorkspace=$shadow
  foreach($name in @('answer.js','created.txt','check.stdout.txt','check.stderr.txt','child-result.json','command-result.json')){Copy-Item -LiteralPath (Join-Path $shadow $name) -Destination (Join-Path $evidence $name)}
  $child=Get-Content -Raw (Join-Path $evidence 'child-result.json')|ConvertFrom-Json
  Assert-Check 'readExistingFile' $child.readVerified
  Assert-Check 'modifiedFileInOverlay' (((Get-Content -Raw (Join-Path $shadow 'answer.js')).Trim()) -eq 'console.log(42);')
  Assert-Check 'createdFileInOverlay' (((Get-Content -Raw (Join-Path $shadow 'created.txt')).Trim()) -eq 'ASTRA_CREATED_IN_SANDBOX')
  Assert-Check 'trivialCheckPassed' ($child.checkExitCode -eq 0 -and (Get-Content -Raw (Join-Path $shadow 'check.stdout.txt')).Contains('console.log(42);'))
  Assert-Check 'stdoutCaptureVerified' ((Get-Content -Raw (Join-Path $shadow 'check.stdout.txt')).Trim() -eq 'console.log(42);')
  Assert-Check 'stderrCaptureVerified' ((Get-Content -Raw (Join-Path $shadow 'check.stderr.txt')).Trim() -eq 'ASTRA_STDERR_CAPTURE_CANARY')
  Assert-Check 'exitCodeCaptureVerified' ($execution.exitCode -eq 0 -and $child.checkExitCode -eq 0)
  Assert-Check 'sandboxInjectionPresent' $child.sbieDllLoaded
  Assert-Check 'protectedWriteDenied' $child.protectedWriteDenied
  Assert-Check 'hostInputUnmodified' (((Get-Content -Raw (Join-Path $workspace 'answer.js')).Trim()) -eq 'console.log(41);')
  Assert-Check 'hostCreatedFileAbsent' (!(Test-Path -LiteralPath (Join-Path $workspace 'created.txt')))
  Assert-Check 'protectedHostUnmodified' ((Get-FileHash (Join-Path $protected 'sentinel.txt')).Hash -eq $beforeHash)
  $receipt.execution=@{launcherPid=$execution.pid;launcherExitCode=$execution.exitCode;shellPid=$child.pid;shellExitCode=$child.shellExitCode;childPid=$child.checkPid;childExitCode=$child.checkExitCode;astraRecordedExitCode=$child.checkExitCode;normalizedResult='exited';terminationReason='exited'}
  }
  $receipt.artifacts=@(Get-ChildItem $evidence -File | Where-Object Name -ne 'receipt.json' | ForEach-Object {@{name=$_.Name;sha256=(Get-FileHash $_.FullName).Hash}})
  $receipt.cleanup='evidence_persisted';Save-Receipt
  [void](Invoke-Cli $start @(('/box:'+$box),'/terminate'))
  $pids=Invoke-Cli $start @(('/box:'+$box),'/listpids')
  Assert-Check 'sandboxProcessesStopped' ($pids.stdout.Trim() -eq '0')
  # The unique box parent contains this canary only; validate before recursive cleanup.
  $configured=(Invoke-Cli $ini @('query',$box,'FileRootPath')).stdout.Trim()
  Assert-Check 'cleanupBoundaryValidated' ($configured -eq $boxRoot -and [IO.Path]::GetFullPath($boxRoot).StartsWith([IO.Path]::GetFullPath($root)+'\'))
  [void](Invoke-Cli $start @(('/box:'+$box),'delete_sandbox'))
  Assert-Check 'sandboxContentRemoved' (!(Test-Path -LiteralPath $boxRoot))
  Set-Box '*' ''
  $after=(Invoke-Cli $ini @('query','*')).stdout.Trim() -split '\r?\n'
  Assert-Check 'sandboxProfileRemoved' ($after -notcontains $box)
  foreach($section in $before){$current=[string](Read-Section $section);$old=[IO.File]::ReadAllText((Join-Path $evidence ('before-'+$section+'.txt')));Assert-Check ('preservedSection_'+$section) ($current -eq $old)}
  Assert-Check 'protectedHostUnmodifiedAfterCleanup' ((Get-FileHash (Join-Path $protected 'sentinel.txt')).Hash -eq $beforeHash)
  $receipt.hostBoundary.afterSha256=(Get-FileHash (Join-Path $protected 'sentinel.txt')).Hash
  $receipt.cleanup='verified';$receipt.result='verified'
} catch {
  $receipt.result='verification_failed';$receipt.error=$_.Exception.Message
  $receipt.cleanup='evidence_retained_for_diagnosis'
  try{if(@(& $ini query '*') -contains $box){[void](Invoke-Cli $start @('/silent',('/box:'+$box),'/terminate'))}}catch{$receipt.terminationError=$_.Exception.Message}
} finally { $receipt.finishedAt=(Get-Date).ToUniversalTime().ToString('o');Save-Receipt }
$receipt|ConvertTo-Json -Depth 12
if($receipt.result -ne 'verified'){exit 1}

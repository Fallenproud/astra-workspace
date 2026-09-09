param([string]$RequestPath)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'astra-child-process.ps1')
$request=Get-Content -Raw -LiteralPath $RequestPath|ConvertFrom-Json
$legacy=$null
if($request.legacyProbe){
  $old=Start-Process -FilePath 'C:\Windows\System32\cmd.exe' -ArgumentList @('/d','/c','exit 0') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'legacy.stdout.txt') -RedirectStandardError (Join-Path $PSScriptRoot 'legacy.stderr.txt') -Wait -PassThru
  $legacy=@{pid=$old.Id;exitCode=$old.ExitCode;exitCodeMissing=($null -eq $old.ExitCode);method='Start-Process -Wait -PassThru'}
}
$cts=[Threading.CancellationTokenSource]::new()
if($request.cancelAfterMs -gt 0){$cts.CancelAfter([int]$request.cancelAfterMs)}
$result=Invoke-AstraChildProcess -Executable $request.executable -Arguments $request.arguments -Cwd $PSScriptRoot -TimeoutMs $request.timeoutMs -CancellationToken $cts.Token
$result.requestId=$request.id
$result.legacyProbe=$legacy
$result.shellPid=$PID
$result.sbieDllLoaded=@((Get-Process -Id $PID).Modules|Where-Object ModuleName -eq 'SbieDll.dll').Count -gt 0
$result.shellExitCode=switch($result.status){'exited'{$result.childExitCode};'timeout'{124};'cancelled'{130};default{125}}
$result|ConvertTo-Json -Depth 8|Set-Content -LiteralPath (Join-Path $PSScriptRoot ($request.id+'.result.json'))
$cts.Dispose()
exit $result.shellExitCode

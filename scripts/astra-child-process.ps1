# Used inside the sandbox. No host execution fallback or model-facing shell API.
function Invoke-AstraChildProcess {
  param([string]$Executable,[string[]]$Arguments=@(),[string]$Cwd,
    [int]$TimeoutMs=30000,[Threading.CancellationToken]$CancellationToken=[Threading.CancellationToken]::None)
  $r=[ordered]@{command=@{executable=$Executable;arguments=$Arguments};cwd=$Cwd;startedAt=[DateTime]::UtcNow.ToString('o');endedAt=$null;childPid=$null;childExitCode=$null;stdout='';stderr='';status='launch_failed';terminationReason='process_launch_failure';error=$null}
  $p=[Diagnostics.Process]::new()
  try {
    if(![IO.Path]::IsPathRooted($Executable) -or !(Test-Path -LiteralPath $Executable -PathType Leaf)){throw 'Executable does not exist at an absolute path'}
    $p.StartInfo.FileName=$Executable;$p.StartInfo.WorkingDirectory=$Cwd
    $p.StartInfo.UseShellExecute=$false;$p.StartInfo.CreateNoWindow=$true
    $p.StartInfo.RedirectStandardOutput=$true;$p.StartInfo.RedirectStandardError=$true
    # Windows argv escaping (not shell escaping); launch executable directly.
    $quoted=foreach($a in $Arguments){'"'+[regex]::Replace([regex]::Replace($a,'(\\*)"','$1$1\"'),'(\\+)$','$1$1')+'"'}
    $p.StartInfo.Arguments=$quoted -join ' '
    if(!$p.Start()){throw 'Process.Start returned false'}
    # Acquire and retain the process handle BEFORE waiting. Windows PowerShell's
    # Start-Process can otherwise return a detached object with a null ExitCode.
    $heldHandle=$p.Handle
    $r.childPid=$p.Id
    $out=$p.StandardOutput.ReadToEndAsync();$err=$p.StandardError.ReadToEndAsync()
    $timer=[Diagnostics.Stopwatch]::StartNew()
    $reason=$null
    while(!$p.WaitForExit(40)){
      if($CancellationToken.IsCancellationRequested){$reason='cancelled';break}
      if($timer.ElapsedMilliseconds -ge $TimeoutMs){$reason='timeout';break}
    }
    if($reason){
      $r.status=$reason;$r.terminationReason=$reason
      $kill=[Diagnostics.ProcessStartInfo]::new('C:\Windows\System32\taskkill.exe',('/PID '+$r.childPid+' /T /F'))
      $kill.UseShellExecute=$false;$kill.CreateNoWindow=$true
      $kill.RedirectStandardOutput=$true;$kill.RedirectStandardError=$true
      $killer=[Diagnostics.Process]::Start($kill)
      if(!$killer.WaitForExit(5000)){throw 'Process-tree termination timed out'}
      $r.treeTerminationExitCode=$killer.ExitCode
      if(!$p.WaitForExit(5000)){throw 'Child remains alive after termination'}
    } else {$r.status='exited';$r.terminationReason='exited'}
    $r.childExitCode=$p.ExitCode
    $r.stdout=$out.GetAwaiter().GetResult();$r.stderr=$err.GetAwaiter().GetResult()
    if($null -eq $r.childExitCode){throw 'Child exit code missing'}
  } catch {
    $r.error=$_.Exception.Message
    if($r.childPid -and $r.status -eq 'launch_failed'){$r.status='observation_failed';$r.terminationReason='exit_status_unavailable'}
  } finally {$r.endedAt=[DateTime]::UtcNow.ToString('o');$p.Dispose()}
  return $r
}

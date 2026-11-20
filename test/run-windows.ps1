#Requires -Version 5.1
<#
.SYNOPSIS
  Run the DSH capability-switch test suite from Windows PowerShell.

.DESCRIPTION
  Locates a Node.js runtime and runs test/run.mjs with the same exit code.
  The lookup order is: -NodePath, node on PATH, the standard Node.js install
  directories, the Node runtimes bundled under ~/.dsh/dsh-runtimes, and
  DSH_NODE_EXECUTABLE.

  The test runs through a redirected .NET child process so that both console
  Node and the GUI-subsystem Electron binary (with ELECTRON_RUN_AS_NODE=1)
  report a reliable exit code.

.PARAMETER NodePath
  Explicit node.exe (or Electron) path. Takes precedence over auto-detection.

.PARAMETER TimeoutSeconds
  Kill the test run after this many seconds. Defaults to 300.

.EXAMPLE
  pwsh -File test/run-windows.ps1

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File test/run-windows.ps1 -NodePath 'C:\Program Files\nodejs\node.exe'
#>
[CmdletBinding()]
param(
  [string]$NodePath,
  [int]$TimeoutSeconds = 300
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$testScript = Join-Path $repoRoot 'test\run.mjs'

function Resolve-NodeCandidate {
  param([string]$Candidate)

  if ([string]::IsNullOrWhiteSpace($Candidate)) { return $null }
  if (-not (Test-Path -LiteralPath $Candidate -PathType Leaf)) { return $null }
  return (Resolve-Path -LiteralPath $Candidate).ProviderPath
}

function Invoke-TestScript {
  param([string]$Node, [string]$Script, [int]$TimeoutSeconds)

  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName = $Node
  $startInfo.Arguments = '"' + $Script.Replace('"', '\"') + '"'
  $startInfo.UseShellExecute = $false
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  $startInfo.StandardOutputEncoding = [System.Text.Encoding]::UTF8
  $startInfo.StandardErrorEncoding = [System.Text.Encoding]::UTF8

  $process = [System.Diagnostics.Process]::Start($startInfo)
  $stdout = $process.StandardOutput.ReadToEndAsync()
  $stderr = $process.StandardError.ReadToEndAsync()
  if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
    try { $process.Kill() } catch { }
    $null = $process.WaitForExit()
    [Console]::Error.WriteLine('Test timed out after ' + $TimeoutSeconds + ' seconds.')
    return 1
  }
  [Console]::Out.Write($stdout.Result)
  [Console]::Error.Write($stderr.Result)
  return $process.ExitCode
}

if (-not (Test-Path -LiteralPath $testScript -PathType Leaf)) {
  [Console]::Error.WriteLine('Cannot find test script: ' + $testScript)
  exit 1
}

# Ordered candidates; the first existing file wins.
$candidates = New-Object System.Collections.Generic.List[string]
if ($NodePath) {
  $explicit = Resolve-NodeCandidate -Candidate $NodePath
  if (-not $explicit) {
    [Console]::Error.WriteLine('Node.js not found at -NodePath: ' + $NodePath)
    exit 1
  }
  $candidates.Add($explicit)
}

foreach ($name in @('node.exe', 'node')) {
  $command = Get-Command $name -ErrorAction SilentlyContinue
  if ($command -and $command.Source) { $candidates.Add($command.Source) }
}

if ($env:ProgramFiles) { $candidates.Add((Join-Path $env:ProgramFiles 'nodejs\node.exe')) }
$programFilesX86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
if ($programFilesX86) { $candidates.Add((Join-Path $programFilesX86 'nodejs\node.exe')) }

if ($env:USERPROFILE) {
  $runtimeRoot = Join-Path $env:USERPROFILE '.dsh\dsh-runtimes'
  if (Test-Path -LiteralPath $runtimeRoot -PathType Container) {
    foreach ($runtime in Get-ChildItem -LiteralPath $runtimeRoot -Directory -ErrorAction SilentlyContinue) {
      $candidates.Add((Join-Path $runtime.FullName 'dependencies\node\bin\node.exe'))
    }
  }
}

if ($env:DSH_NODE_EXECUTABLE) { $candidates.Add($env:DSH_NODE_EXECUTABLE) }

$resolved = $null
foreach ($candidate in $candidates) {
  $resolved = Resolve-NodeCandidate -Candidate $candidate
  if ($resolved) { break }
}

if (-not $resolved) {
  [Console]::Error.WriteLine('Cannot find Node.js: install it on PATH, pass -NodePath, or set DSH_NODE_EXECUTABLE.')
  exit 1
}

# Desktop DSH ships Electron as its executable; this flag makes it run as Node.
$env:ELECTRON_RUN_AS_NODE = '1'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
Write-Host ('Using Node: ' + $resolved)
exit (Invoke-TestScript -Node $resolved -Script $testScript -TimeoutSeconds $TimeoutSeconds)

'use strict';
// Runs in Windows PowerShell 5.1 (pwsh elsewhere), so solutions avoid 7-only
// syntax (no ternary, no ??). The script is: helpers, `setup`, the learner's
// code, `tests`. Helpers:  T NAME ACTUAL EXPECTED (compared as JSON)  ·  TOK NAME BOOL
// Authoring trap: no backticks (JS template literal) — PowerShell's escape
// character is avoided on purpose.

const SERVICES = `$__services = @(
  [pscustomobject]@{ Name = 'Spooler'; Status = 'Running'; MemoryMB = 12 }
  [pscustomobject]@{ Name = 'WinRM'; Status = 'Stopped'; MemoryMB = 0 }
  [pscustomobject]@{ Name = 'SQLServer'; Status = 'Running'; MemoryMB = 2048 }
  [pscustomobject]@{ Name = 'W3SVC'; Status = 'Running'; MemoryMB = 310 }
  [pscustomobject]@{ Name = 'Backup'; Status = 'Stopped'; MemoryMB = 0 }
)
`;
const EMPLOYEES = `$__staff = @(
  [pscustomobject]@{ Name = 'Ada'; Dept = 'Engineering'; Salary = 150000 }
  [pscustomobject]@{ Name = 'Linus'; Dept = 'Engineering'; Salary = 120000 }
  [pscustomobject]@{ Name = 'Dennis'; Dept = 'Support'; Salary = 70000 }
  [pscustomobject]@{ Name = 'Ken'; Dept = 'Sales'; Salary = 90000 }
  [pscustomobject]@{ Name = 'Grace'; Dept = 'Engineering'; Salary = 125000 }
  [pscustomobject]@{ Name = 'Barbara'; Dept = 'Sales'; Salary = 82000 }
)
`;

module.exports = {
  id: 'powershell',
  name: 'PowerShell',
  short: 'PS',
  blurb: 'The object pipeline: functions, parameters, filtering, CSV/JSON, and scripts that fail loudly.',
  lang: 'powershell',
  runner: { kind: 'ps' },
  challenges: [
    {
      id: 'greeting', title: 'Functions and parameters', tier: 1,
      prompt: "Write a function `Get-Greeting` with a `-Name` parameter that defaults to `World`. It returns the string `Hello, <Name>!`.",
      starter: `function Get-Greeting {\n  param(\n    \n  )\n\n}\n`,
      solution: `function Get-Greeting {\n  param(\n    [string]$Name = 'World'\n  )\n  "Hello, $Name!"\n}\n`,
      tests: `T 'named parameter' (Get-Greeting -Name 'Ada') 'Hello, Ada!'
T 'positional' (Get-Greeting 'Linus') 'Hello, Linus!'
T 'default' (Get-Greeting) 'Hello, World!'`,
      hints: ['Parameters are declared in a `param( )` block: `[string]$Name = "World"`.', 'Double-quoted strings expand variables. A value left on its own line is the function\'s output — no `return` needed.'],
    },
    {
      id: 'add', title: 'Typed parameters', tier: 1,
      prompt: "Write `Add-Numbers` taking two **integer** parameters, `-A` and `-B`, and returning their sum. Typing them as `[int]` means the string `'5'` is converted for you — and `'five'` is rejected.",
      starter: `function Add-Numbers {\n  param($A, $B)\n\n}\n`,
      solution: `function Add-Numbers {\n  param([int]$A, [int]$B)\n  $A + $B\n}\n`,
      tests: `T 'adds' (Add-Numbers -A 2 -B 3) 5
T 'converts numeric strings' (Add-Numbers -A '5' -B '6') 11
$__threw = $false; try { Add-Numbers -A 'five' -B 1 -ErrorAction Stop | Out-Null } catch { $__threw = $true }
TOK 'rejects non-numbers' $__threw`,
      hints: ['Put a type in square brackets before the parameter: `[int]$A`.', "Untyped, `'5' + '6'` is string concatenation: `56`."],
    },
    {
      id: 'even', title: 'Booleans and operators', tier: 1,
      prompt: "Write `Test-Even` that returns `$true` when its `-Number` is even and `$false` otherwise. PowerShell comparison operators are words: `-eq`, `-ne`, `-gt`, `-lt`.",
      starter: `function Test-Even {\n  param([int]$Number)\n\n}\n`,
      solution: `function Test-Even {\n  param([int]$Number)\n  $Number % 2 -eq 0\n}\n`,
      tests: `T 'even' (Test-Even -Number 4) $true
T 'odd' (Test-Even -Number 7) $false
T 'zero' (Test-Even 0) $true
T 'negative' (Test-Even -3) $false`,
      hints: ['`%` is the remainder operator.', 'Equality is `-eq`, not `==`. The comparison itself produces `$true` or `$false`.'],
    },
    {
      id: 'day-type', title: 'switch', tier: 1,
      prompt: "Write `Get-DayType` taking a day name. Return `Weekend` for Saturday and Sunday, `Weekday` for Monday through Friday, and `Unknown` for anything else. Matching should ignore case.",
      starter: `function Get-DayType {\n  param([string]$Day)\n\n}\n`,
      solution: `function Get-DayType {\n  param([string]$Day)\n  switch ($Day) {\n    { $_ -in 'Saturday', 'Sunday' } { 'Weekend'; break }\n    { $_ -in 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday' } { 'Weekday'; break }\n    default { 'Unknown' }\n  }\n}\n`,
      tests: `T 'weekend' (Get-DayType 'Saturday') 'Weekend'
T 'weekday' (Get-DayType 'Wednesday') 'Weekday'
T 'ignores case' (Get-DayType 'sunday') 'Weekend'
T 'unknown' (Get-DayType 'Caturday') 'Unknown'`,
      hints: ['`switch ($value) { "a" { ... } "b" { ... } default { ... } }`.', 'String comparison in PowerShell is case-insensitive by default.', '`-in` tests membership: `$Day -in "Saturday", "Sunday"`.'],
    },
    {
      id: 'evens', title: 'Where-Object', tier: 1,
      prompt: "Write `Get-Evens` taking an array `-Numbers` and returning only the even ones, by piping to `Where-Object`.",
      starter: `function Get-Evens {\n  param([int[]]$Numbers)\n\n}\n`,
      solution: `function Get-Evens {\n  param([int[]]$Numbers)\n  $Numbers | Where-Object { $_ % 2 -eq 0 }\n}\n`,
      tests: `T 'filters' @(Get-Evens -Numbers 1, 2, 3, 4, 5, 6) @(2, 4, 6)
T 'none match' @(Get-Evens -Numbers 1, 3) @()
T 'uses the pipeline' ((Get-Command Get-Evens).Definition -match 'Where-Object|\\?\\s*\\{') $true`,
      hints: ['`$collection | Where-Object { condition }` keeps the items for which the script block is true.', 'Inside the block, `$_` is the current item.'],
    },
    {
      id: 'squares', title: 'ForEach-Object', tier: 1,
      prompt: "Write `Get-Squares` taking an array `-Numbers` and returning each number squared, using `ForEach-Object`.",
      starter: `function Get-Squares {\n  param([int[]]$Numbers)\n\n}\n`,
      solution: `function Get-Squares {\n  param([int[]]$Numbers)\n  $Numbers | ForEach-Object { $_ * $_ }\n}\n`,
      tests: `T 'squares' @(Get-Squares -Numbers 1, 2, 3) @(1, 4, 9)
T 'negatives' @(Get-Squares -Numbers -4) @(16)`,
      hints: ['`ForEach-Object { ... }` runs the block once per item; whatever the block outputs flows on down the pipeline.'],
    },
    {
      id: 'initials', title: 'String methods', tier: 1,
      prompt: "Write `Get-Initials` taking a full name and returning its initials in capitals: `'ada lovelace'` → `AL`, `'Grace Brewster Hopper'` → `GBH`. Extra spaces between words must not break it.",
      starter: `function Get-Initials {\n  param([string]$Name)\n\n}\n`,
      solution: `function Get-Initials {\n  param([string]$Name)\n  $letters = $Name -split '\\s+' | Where-Object { $_ } | ForEach-Object { $_.Substring(0, 1).ToUpper() }\n  -join $letters\n}\n`,
      tests: `T 'two words' (Get-Initials 'ada lovelace') 'AL'
T 'three words' (Get-Initials 'Grace Brewster Hopper') 'GBH'
T 'extra spaces' (Get-Initials '  linus   torvalds ') 'LT'
T 'one word' (Get-Initials 'Plato') 'P'`,
      hints: ["`-split '\\s+'` splits on runs of whitespace (it is a regex).", 'Strings are .NET objects: `.Substring(0, 1)`, `.ToUpper()`.', 'The unary `-join $array` glues elements together with nothing between.'],
    },
    {
      id: 'total', title: 'Measure-Object', tier: 1,
      prompt: "Write `Get-PayrollTotal` taking an array of employee objects (each has a `Salary` property) and returning the sum of all salaries. Use `Measure-Object`.",
      setup: EMPLOYEES,
      starter: `function Get-PayrollTotal {\n  param($Employees)\n\n}\n`,
      solution: `function Get-PayrollTotal {\n  param($Employees)\n  ($Employees | Measure-Object -Property Salary -Sum).Sum\n}\n`,
      tests: `T 'sums salaries' (Get-PayrollTotal -Employees $__staff) 637000
T 'one employee' (Get-PayrollTotal -Employees @($__staff[2])) 70000`,
      hints: ['`Measure-Object -Property X -Sum` returns an object; the number is in its `.Sum` property.', 'Wrap a pipeline in parentheses to read a property off its result.'],
    },
    {
      id: 'word-count', title: 'Hashtables', tier: 2,
      prompt: "Write `Get-WordCount` taking a string `-Text` and returning a **hashtable** mapping each word (lower-cased) to how many times it appears. Words are separated by whitespace.",
      starter: `function Get-WordCount {\n  param([string]$Text)\n\n}\n`,
      solution: `function Get-WordCount {\n  param([string]$Text)\n  $counts = @{}\n  foreach ($word in ($Text.ToLower() -split '\\s+')) {\n    if ($word) { $counts[$word] = 1 + $counts[$word] }\n  }\n  $counts\n}\n`,
      tests: `$__wc = Get-WordCount -Text 'the cat The dog  the end'
TOK 'returns a hashtable' ($__wc -is [hashtable])
T 'counts repeats, ignoring case' $__wc['the'] 3
T 'counts singles' $__wc['dog'] 1
T 'four distinct words' $__wc.Count 4
T 'empty text' (Get-WordCount -Text '').Count 0`,
      hints: ['`@{}` is an empty hashtable; `$h[$key]` reads and writes.', 'A missing key reads as `$null`, and `1 + $null` is `1` — so no "does it exist yet" check is needed.'],
    },
    {
      id: 'new-user', title: 'Custom objects', tier: 2,
      prompt: "PowerShell pipelines carry objects, not text. Write `New-User` with `-Name` and `-Age` that returns a `[pscustomobject]` with three properties: `Name`, `Age`, and `IsAdult` (`$true` when the age is 18 or more).",
      starter: `function New-User {\n  param([string]$Name, [int]$Age)\n\n}\n`,
      solution: `function New-User {\n  param([string]$Name, [int]$Age)\n  [pscustomobject]@{\n    Name    = $Name\n    Age     = $Age\n    IsAdult = $Age -ge 18\n  }\n}\n`,
      tests: `$__u = New-User -Name 'Ada' -Age 36
T 'Name' $__u.Name 'Ada'
T 'Age' $__u.Age 36
T 'IsAdult true' $__u.IsAdult $true
T 'IsAdult false' (New-User -Name 'Kid' -Age 12).IsAdult $false
T 'exactly 18 is an adult' (New-User -Name 'Edge' -Age 18).IsAdult $true
T 'three properties' @($__u.PSObject.Properties.Name) @('Name', 'Age', 'IsAdult')`,
      hints: ['`[pscustomobject]@{ Key = value; Other = value }` builds an object with those properties.', 'Greater-or-equal is `-ge`.'],
    },
    {
      id: 'top', title: 'Sort and Select', tier: 2,
      prompt: "Write `Get-TopEarners` taking `-Employees` and `-Count`. Return the **names** of the `Count` highest-paid employees, highest first.",
      setup: EMPLOYEES,
      starter: `function Get-TopEarners {\n  param($Employees, [int]$Count)\n\n}\n`,
      solution: `function Get-TopEarners {\n  param($Employees, [int]$Count)\n  $Employees | Sort-Object -Property Salary -Descending | Select-Object -First $Count -ExpandProperty Name\n}\n`,
      tests: `T 'top two' @(Get-TopEarners -Employees $__staff -Count 2) @('Ada', 'Grace')
T 'top one' @(Get-TopEarners -Employees $__staff -Count 1) @('Ada')
T 'returns strings, not objects' ((Get-TopEarners -Employees $__staff -Count 1) -is [string]) $true`,
      hints: ['`Sort-Object -Property Salary -Descending`.', '`Select-Object -First N` keeps the first N.', '`-ExpandProperty Name` gives you the bare values rather than objects with a `Name` property.'],
    },
    {
      id: 'group', title: 'Group-Object', tier: 2,
      prompt: "Write `Get-HeadCount` taking `-Employees` and returning one string per department, formatted `Dept: N`, sorted by department name — e.g. `Engineering: 3`.",
      setup: EMPLOYEES,
      starter: `function Get-HeadCount {\n  param($Employees)\n\n}\n`,
      solution: `function Get-HeadCount {\n  param($Employees)\n  $Employees | Group-Object -Property Dept | Sort-Object -Property Name | ForEach-Object { "$($_.Name): $($_.Count)" }\n}\n`,
      tests: `T 'head count per department' @(Get-HeadCount -Employees $__staff) @('Engineering: 3', 'Sales: 2', 'Support: 1')`,
      hints: ['`Group-Object -Property Dept` emits one object per group, with `Name`, `Count` and `Group`.', 'To put a *property* inside a string you need a subexpression: `"$($_.Name)"`. Plain `"$_.Name"` expands `$_` and then appends the text `.Name`.'],
    },
    {
      id: 'disk-report', title: 'Calculated properties', tier: 2,
      prompt: "Write `Get-LowDisks` taking `-Disks` (objects with `Name`, `SizeGB`, `FreeGB`). Return objects with two properties — `Name` and `PercentFree` (a whole number, rounded) — for disks with **less than 20%** free, sorted with the fullest disk first.",
      setup: `$__disks = @(
  [pscustomobject]@{ Name = 'C:'; SizeGB = 500; FreeGB = 40 }
  [pscustomobject]@{ Name = 'D:'; SizeGB = 2000; FreeGB = 1500 }
  [pscustomobject]@{ Name = 'E:'; SizeGB = 250; FreeGB = 5 }
  [pscustomobject]@{ Name = 'F:'; SizeGB = 100; FreeGB = 20 }
)
`,
      starter: `function Get-LowDisks {\n  param($Disks)\n\n}\n`,
      solution: `function Get-LowDisks {\n  param($Disks)\n  $Disks |\n    Select-Object -Property Name, @{ Name = 'PercentFree'; Expression = { [int][math]::Round(100 * $_.FreeGB / $_.SizeGB) } } |\n    Where-Object { $_.PercentFree -lt 20 } |\n    Sort-Object -Property PercentFree\n}\n`,
      tests: `$__low = @(Get-LowDisks -Disks $__disks)
T 'two low disks, fullest first' @($__low | ForEach-Object { $_.Name }) @('E:', 'C:')
T 'percentages' @($__low | ForEach-Object { $_.PercentFree }) @(2, 8)
T 'only the two properties' @($__low[0].PSObject.Properties.Name) @('Name', 'PercentFree')
T 'exactly 20% is not low' (@($__low | Where-Object { $_.Name -eq 'F:' }).Count) 0`,
      hints: ["`Select-Object Name, @{ Name = 'PercentFree'; Expression = { ... } }` adds a computed column.", '`[math]::Round(x)` rounds; cast with `[int]` to get a whole number.', 'Compute first, then filter and sort on the new property.'],
    },
    {
      id: 'csv', title: 'CSV in, objects out', tier: 2,
      prompt: "Write `Get-ActiveUsers` taking CSV **text** with the columns `Name,Department,Active`. Return the names of the users whose `Active` column is `true`, sorted alphabetically. Use `ConvertFrom-Csv`.",
      starter: `function Get-ActiveUsers {\n  param([string]$Csv)\n\n}\n`,
      solution: `function Get-ActiveUsers {\n  param([string]$Csv)\n  $Csv | ConvertFrom-Csv | Where-Object { $_.Active -eq 'true' } | Sort-Object -Property Name | ForEach-Object { $_.Name }\n}\n`,
      tests: `$__csv = "Name,Department,Active" + [Environment]::NewLine + "Linus,Eng,true" + [Environment]::NewLine + "Dennis,Support,false" + [Environment]::NewLine + "Ada,Eng,TRUE" + [Environment]::NewLine + "Ken,Sales,true"
T 'active users, sorted' @(Get-ActiveUsers -Csv $__csv) @('Ada', 'Ken', 'Linus')`,
      hints: ['`ConvertFrom-Csv` turns each row into an object whose properties are the column headers.', 'Every CSV value is a **string**: the column holds the text `"true"`, not the boolean `$true`.'],
    },
    {
      id: 'json', title: 'JSON', tier: 2,
      prompt: "Write `Get-UpServers` taking JSON text shaped like `{ \"servers\": [ { \"name\": \"web1\", \"status\": \"up\", \"port\": 443 }, ... ] }`. Return a JSON **string** (compressed, no whitespace) containing an array of `{ name, url }` objects for servers that are `up`, where `url` is `https://<name>:<port>`.",
      starter: `function Get-UpServers {\n  param([string]$Json)\n\n}\n`,
      solution: `function Get-UpServers {\n  param([string]$Json)\n  $up = @(($Json | ConvertFrom-Json).servers | Where-Object { $_.status -eq 'up' } | ForEach-Object {\n      [pscustomobject]@{ name = $_.name; url = "https://$($_.name):$($_.port)" }\n    })\n  ConvertTo-Json -InputObject $up -Compress\n}\n`,
      tests: `$__json = '{"servers":[{"name":"web1","status":"up","port":443},{"name":"db1","status":"down","port":5432},{"name":"api1","status":"up","port":8443}]}'
T 'filters and reshapes' (Get-UpServers -Json $__json) '[{"name":"web1","url":"https://web1:443"},{"name":"api1","url":"https://api1:8443"}]'
T 'one result is still an array' (Get-UpServers -Json '{"servers":[{"name":"solo","status":"up","port":80}]}') '[{"name":"solo","url":"https://solo:80"}]'`,
      hints: ['`ConvertFrom-Json` gives objects you can dot into: `.servers`.', '`ConvertTo-Json -Compress` goes back to text.', 'PowerShell unwraps one-element arrays in a pipeline. `@( ... )` forces an array, and `ConvertTo-Json -InputObject $array` keeps it one.'],
    },
    {
      id: 'emails', title: 'Regular expressions', tier: 2,
      prompt: "Write `Get-Emails` taking a block of text and returning every email address in it, lower-cased, with duplicates removed, in order of first appearance.",
      starter: `function Get-Emails {\n  param([string]$Text)\n\n}\n`,
      solution: `function Get-Emails {\n  param([string]$Text)\n  [regex]::Matches($Text, '[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+') | ForEach-Object { $_.Value.ToLower() } | Select-Object -Unique\n}\n`,
      tests: `$__text = 'Contact Ada@Example.test or ops+alerts@corp.example.test; cc ada@example.test. Not an email: foo@ or @bar.'
T 'finds, lowercases, de-duplicates' @(Get-Emails -Text $__text) @('ada@example.test', 'ops+alerts@corp.example.test')
T 'nothing to find' @(Get-Emails -Text 'no addresses here') @()`,
      hints: ['`[regex]::Matches($text, $pattern)` returns every match; each has a `.Value`.', '`Select-Object -Unique` drops repeats and keeps the first occurrence.', 'The simpler `-match` operator only finds the first match.'],
    },
    {
      id: 'format-bytes', title: 'Number formatting', tier: 2,
      prompt: "Write `Format-Bytes` taking a byte count and returning a readable string:\n\n- under 1 KB → `512 B`\n- under 1 MB → kilobytes, e.g. `1.5 KB`\n- under 1 GB → megabytes, e.g. `2 MB`\n- otherwise → gigabytes, e.g. `3.2 GB`\n\nRound to one decimal place. PowerShell has the numeric suffixes `1KB`, `1MB`, `1GB` built in.",
      starter: `function Format-Bytes {\n  param([long]$Bytes)\n\n}\n`,
      solution: `function Format-Bytes {\n  param([long]$Bytes)\n  if ($Bytes -lt 1KB) { return "$Bytes B" }\n  if ($Bytes -lt 1MB) { return "$([math]::Round($Bytes / 1KB, 1)) KB" }\n  if ($Bytes -lt 1GB) { return "$([math]::Round($Bytes / 1MB, 1)) MB" }\n  "$([math]::Round($Bytes / 1GB, 1)) GB"\n}\n`,
      tests: `T 'bytes' (Format-Bytes 512) '512 B'
T 'kilobytes' (Format-Bytes 1536) '1.5 KB'
T 'exact megabytes' (Format-Bytes 2097152) '2 MB'
T 'gigabytes' (Format-Bytes 3435973837) '3.2 GB'
T 'boundary' (Format-Bytes 1024) '1 KB'`,
      hints: ['`1KB` is 1024, `1MB` is 1048576, and so on.', '`[math]::Round(value, 1)` keeps one decimal.', 'Method calls inside a string need the subexpression form: `"$([math]::Round(...)) KB"`.'],
    },
    {
      id: 'safe', title: 'try / catch', tier: 2,
      prompt: "Write `Invoke-Safely` taking a script block `-Action`. Run it. If it succeeds, return its result. If it throws, return the string `ERROR: <message>` instead of letting the error escape.",
      starter: `function Invoke-Safely {\n  param([scriptblock]$Action)\n\n}\n`,
      solution: `function Invoke-Safely {\n  param([scriptblock]$Action)\n  try {\n    & $Action\n  }\n  catch {\n    "ERROR: $($_.Exception.Message)"\n  }\n}\n`,
      tests: `T 'passes results through' (Invoke-Safely -Action { 6 * 7 }) 42
T 'catches throw' (Invoke-Safely -Action { throw 'disk full' }) 'ERROR: disk full'
TOK 'catches .NET exceptions' ((Invoke-Safely -Action { [int]::Parse('abc') }) -like 'ERROR: *correct format*')
T 'keeps running afterwards' (Invoke-Safely -Action { 'still alive' }) 'still alive'`,
      hints: ['`& $scriptBlock` runs a script block.', 'Inside `catch`, `$_` is the error record; the text is at `$_.Exception.Message`.'],
    },
    {
      id: 'validate', title: 'Parameter validation', tier: 2,
      prompt: "Let PowerShell reject bad input for you. Write `Set-Volume` with:\n\n- a **mandatory** `-Level` integer that must be between 0 and 10 (`ValidateRange`)\n- an optional `-Device` that must be one of `Speakers`, `Headphones` (`ValidateSet`), defaulting to `Speakers`\n\nIt returns `<Device> volume set to <Level>`.",
      starter: `function Set-Volume {\n  param(\n    $Level,\n    $Device = 'Speakers'\n  )\n  "$Device volume set to $Level"\n}\n`,
      solution: `function Set-Volume {\n  param(\n    [Parameter(Mandatory)]\n    [ValidateRange(0, 10)]\n    [int]$Level,\n\n    [ValidateSet('Speakers', 'Headphones')]\n    [string]$Device = 'Speakers'\n  )\n  "$Device volume set to $Level"\n}\n`,
      tests: `function __Fails($sb) { try { & $sb | Out-Null; $false } catch { $true } }
T 'valid call' (Set-Volume -Level 7) 'Speakers volume set to 7'
T 'other device' (Set-Volume -Level 0 -Device Headphones) 'Headphones volume set to 0'
TOK 'rejects 11' (__Fails { Set-Volume -Level 11 })
TOK 'rejects -1' (__Fails { Set-Volume -Level -1 })
TOK 'rejects an unknown device' (__Fails { Set-Volume -Level 5 -Device Toaster })
TOK 'Level is mandatory' ((Get-Command Set-Volume).Parameters['Level'].Attributes | Where-Object { $_ -is [Parameter] -and $_.Mandatory }) `,
      hints: ['Attributes stack above a parameter: `[Parameter(Mandatory)]`, `[ValidateRange(0, 10)]`, `[ValidateSet("a", "b")]`.', 'Validation happens before your function body runs, so the body can assume good input.'],
    },
    {
      id: 'pipeline-input', title: 'Accept pipeline input', tier: 3,
      prompt: "Make a function that works in the middle of a pipeline. Write `ConvertTo-Fahrenheit` so that both of these work:\n\n- `0, 100 | ConvertTo-Fahrenheit` → `32`, `212`\n- `ConvertTo-Fahrenheit -Celsius 37` → `98.6`\n\nThe formula is `C × 9 / 5 + 32`. Round to one decimal place.",
      starter: `function ConvertTo-Fahrenheit {\n  param(\n    [double]$Celsius\n  )\n\n}\n`,
      solution: `function ConvertTo-Fahrenheit {\n  param(\n    [Parameter(Mandatory, ValueFromPipeline)]\n    [double]$Celsius\n  )\n  process {\n    [math]::Round($Celsius * 9 / 5 + 32, 1)\n  }\n}\n`,
      tests: `T 'from the pipeline' @(0, 100, -40 | ConvertTo-Fahrenheit) @(32, 212, -40)
T 'as a parameter' (ConvertTo-Fahrenheit -Celsius 37) 98.6
T 'chains onward' @(10, 20 | ConvertTo-Fahrenheit | Where-Object { $_ -gt 60 }) @(68)`,
      hints: ['Mark the parameter `[Parameter(ValueFromPipeline)]`.', 'Code in a `process { }` block runs **once per piped item**. Without it, the function body runs once, seeing only the last item.'],
    },
    {
      id: 'large-files', title: 'Working with files', tier: 3,
      prompt: "Write `Get-LargeFiles` with `-Path` and `-MinBytes`. Return the **names** of files (not folders) anywhere under the path, at any depth, whose size is at least `MinBytes`, sorted largest first.",
      setup: `$__root = Join-Path $PWD 'data'
New-Item -ItemType Directory -Force -Path (Join-Path $__root 'sub\\deep') | Out-Null
[IO.File]::WriteAllText((Join-Path $__root 'small.txt'), ('x' * 10))
[IO.File]::WriteAllText((Join-Path $__root 'medium.log'), ('x' * 500))
[IO.File]::WriteAllText((Join-Path $__root 'sub\\big.bin'), ('x' * 5000))
[IO.File]::WriteAllText((Join-Path $__root 'sub\\deep\\huge.iso'), ('x' * 20000))
`,
      starter: `function Get-LargeFiles {\n  param([string]$Path, [long]$MinBytes)\n\n}\n`,
      solution: `function Get-LargeFiles {\n  param([string]$Path, [long]$MinBytes)\n  Get-ChildItem -Path $Path -Recurse -File |\n    Where-Object { $_.Length -ge $MinBytes } |\n    Sort-Object -Property Length -Descending |\n    ForEach-Object { $_.Name }\n}\n`,
      tests: `T 'at least 500 bytes' @(Get-LargeFiles -Path $__root -MinBytes 500) @('huge.iso', 'big.bin', 'medium.log')
T 'at least 6000 bytes' @(Get-LargeFiles -Path $__root -MinBytes 6000) @('huge.iso')
T 'nothing that large' @(Get-LargeFiles -Path $__root -MinBytes 999999) @()
T 'folders are not files' (@(Get-LargeFiles -Path $__root -MinBytes 0) -contains 'sub') $false`,
      hints: ['`Get-ChildItem -Recurse -File` lists files at every depth and skips directories.', 'Each file object has `.Name` and `.Length` (size in bytes).'],
    },
    {
      id: 'boss-services', title: 'Boss: service health report', tier: 3,
      prompt: "Write `Get-ServiceReport` taking `-Services` (objects with `Name`, `Status`, `MemoryMB`). Return **one** `[pscustomobject]` with:\n\n- `Running` — number of running services\n- `Stopped` — number of stopped services\n- `TotalMemoryMB` — memory used by running services\n- `Heaviest` — the name of the running service using the most memory\n- `StoppedNames` — the stopped services' names, sorted, joined with `, `\n- `Healthy` — `$true` only when nothing is stopped",
      setup: SERVICES,
      starter: `function Get-ServiceReport {\n  param($Services)\n\n}\n`,
      solution: `function Get-ServiceReport {\n  param($Services)\n  $running = @($Services | Where-Object { $_.Status -eq 'Running' })\n  $stopped = @($Services | Where-Object { $_.Status -eq 'Stopped' })\n  [pscustomobject]@{\n    Running       = $running.Count\n    Stopped       = $stopped.Count\n    TotalMemoryMB = ($running | Measure-Object -Property MemoryMB -Sum).Sum\n    Heaviest      = ($running | Sort-Object -Property MemoryMB -Descending | Select-Object -First 1).Name\n    StoppedNames  = ($stopped | Sort-Object -Property Name | ForEach-Object { $_.Name }) -join ', '\n    Healthy       = $stopped.Count -eq 0\n  }\n}\n`,
      tests: `$__r = Get-ServiceReport -Services $__services
T 'Running' $__r.Running 3
T 'Stopped' $__r.Stopped 2
T 'TotalMemoryMB' $__r.TotalMemoryMB 2370
T 'Heaviest' $__r.Heaviest 'SQLServer'
T 'StoppedNames' $__r.StoppedNames 'Backup, WinRM'
T 'Healthy' $__r.Healthy $false
$__ok = Get-ServiceReport -Services @($__services | Where-Object { $_.Status -eq 'Running' })
T 'all running is healthy' $__ok.Healthy $true
T 'no stopped names' $__ok.StoppedNames ''
T 'a single service still counts as 1' (Get-ServiceReport -Services @($__services[0])).Running 1`,
      hints: ['Split the input into two arrays first; every property is then a short pipeline over one of them.', 'Wrap filters in `@( )` — otherwise one match is a bare object and `.Count` is not what you expect.', '`-join ", "` turns an array into one string.'],
    },
    {
      id: 'max', title: 'Largest number', tier: 1,
      prompt: "Write `Get-Largest` taking an array `-Numbers` and returning the largest value. Use `Measure-Object`.",
      starter: `function Get-Largest {\n  param([int[]]$Numbers)\n\n}\n`,
      solution: `function Get-Largest {\n  param([int[]]$Numbers)\n  ($Numbers | Measure-Object -Maximum).Maximum\n}\n`,
      tests: `T 'picks the largest' (Get-Largest -Numbers 3, 9, 4) 9
T 'negatives' (Get-Largest -Numbers -8, -3, -5) (-3)
T 'single value' (Get-Largest -Numbers 7) 7`,
      hints: ['`Measure-Object -Maximum` returns an object; the number is in `.Maximum`.'],
    },
    {
      id: 'snake', title: 'Replace with -replace', tier: 1,
      prompt: "Write `ConvertTo-SnakeCase` taking a string and returning it lower-cased with every run of spaces replaced by a single underscore: `'Quarterly  Sales Report'` → `quarterly_sales_report`.",
      starter: `function ConvertTo-SnakeCase {\n  param([string]$Text)\n\n}\n`,
      solution: `function ConvertTo-SnakeCase {\n  param([string]$Text)\n  ($Text.Trim() -replace '\\s+', '_').ToLower()\n}\n`,
      tests: `T 'spaces and capitals' (ConvertTo-SnakeCase 'Quarterly Sales Report') 'quarterly_sales_report'
T 'runs of spaces collapse' (ConvertTo-SnakeCase 'a   b') 'a_b'
T 'outer spaces are dropped' (ConvertTo-SnakeCase '  Trim Me ') 'trim_me'`,
      hints: ["`-replace 'pattern', 'replacement'` uses a regular expression.", "`\\s+` means one or more whitespace characters."],
    },
    {
      id: 'palindrome', title: 'Reverse a string', tier: 1,
      prompt: "Write `Test-Palindrome` returning `$true` when the text reads the same in both directions, ignoring case, spaces and punctuation.",
      starter: `function Test-Palindrome {\n  param([string]$Text)\n\n}\n`,
      solution: `function Test-Palindrome {\n  param([string]$Text)\n  $clean = ($Text -replace '[^a-zA-Z0-9]', '').ToLower()\n  $chars = $clean.ToCharArray()\n  [array]::Reverse($chars)\n  $clean -eq (-join $chars)\n}\n`,
      tests: `T 'simple word' (Test-Palindrome 'level') $true
T 'ignores case and punctuation' (Test-Palindrome 'A man, a plan, a canal: Panama') $true
T 'not a palindrome' (Test-Palindrome 'PowerShell') $false
T 'empty counts' (Test-Palindrome '') $true`,
      hints: ["Strip unwanted characters first: `-replace '[^a-zA-Z0-9]', ''`.", '`.ToCharArray()` then `[array]::Reverse($chars)` reverses in place; `-join $chars` turns it back into a string.'],
    },
    {
      id: 'fibonacci', title: 'Loops', tier: 1,
      prompt: "Write `Get-Fibonacci -Count N` returning the first `N` Fibonacci numbers, starting `0, 1, 1, 2, 3, 5`. A count of 0 returns nothing.",
      starter: `function Get-Fibonacci {\n  param([int]$Count)\n\n}\n`,
      solution: `function Get-Fibonacci {\n  param([int]$Count)\n  $a = 0; $b = 1\n  for ($i = 0; $i -lt $Count; $i++) {\n    $a\n    $a, $b = $b, ($a + $b)\n  }\n}\n`,
      tests: `T 'first eight' @(Get-Fibonacci -Count 8) @(0, 1, 1, 2, 3, 5, 8, 13)
T 'first one' @(Get-Fibonacci -Count 1) @(0)
T 'none' @(Get-Fibonacci -Count 0) @()`,
      hints: ['Writing a bare value inside a loop sends it to the output — each pass emits one number.', 'PowerShell can swap in one line: `$a, $b = $b, ($a + $b)`.'],
    },
    {
      id: 'join-names', title: 'Join a list for humans', tier: 2,
      prompt: "Write `Join-Names` taking an array `-Names` and returning a readable sentence fragment:\n\n- none → an empty string\n- one → `Ada`\n- two → `Ada and Linus`\n- three or more → `Ada, Linus and Grace`",
      starter: `function Join-Names {\n  param([string[]]$Names)\n\n}\n`,
      solution: `function Join-Names {\n  param([string[]]$Names)\n  $list = @($Names)\n  if ($list.Count -eq 0) { return '' }\n  if ($list.Count -eq 1) { return $list[0] }\n  $head = $list[0..($list.Count - 2)] -join ', '\n  "$head and $($list[-1])"\n}\n`,
      tests: `T 'three' (Join-Names -Names 'Ada', 'Linus', 'Grace') 'Ada, Linus and Grace'
T 'two' (Join-Names -Names 'Ada', 'Linus') 'Ada and Linus'
T 'one' (Join-Names -Names 'Ada') 'Ada'
T 'none' (Join-Names -Names @()) ''
T 'four' (Join-Names -Names 'a', 'b', 'c', 'd') 'a, b, c and d'`,
      hints: ['`$list[-1]` is the last element; `$list[0..($list.Count - 2)]` is everything before it.', "`-join ', '` glues an array into a string."],
    },
    {
      id: 'average-by-dept', title: 'Filter, then measure', tier: 2,
      prompt: "Write `Get-AverageSalary` with `-Employees` and `-Dept`. Return the average salary of the employees in that department, rounded to a whole number — or `0` if nobody is in it.",
      setup: EMPLOYEES,
      starter: `function Get-AverageSalary {\n  param($Employees, [string]$Dept)\n\n}\n`,
      solution: `function Get-AverageSalary {\n  param($Employees, [string]$Dept)\n  $members = @($Employees | Where-Object { $_.Dept -eq $Dept })\n  if ($members.Count -eq 0) { return 0 }\n  [int][math]::Round(($members | Measure-Object -Property Salary -Average).Average)\n}\n`,
      tests: `T 'engineering' (Get-AverageSalary -Employees $__staff -Dept 'Engineering') 131667
T 'sales' (Get-AverageSalary -Employees $__staff -Dept 'Sales') 86000
T 'one person' (Get-AverageSalary -Employees $__staff -Dept 'Support') 70000
T 'empty department' (Get-AverageSalary -Employees $__staff -Dept 'Legal') 0`,
      hints: ['`Where-Object` narrows to the department; `Measure-Object -Property Salary -Average` does the maths.', '`Measure-Object` on nothing returns an object whose `.Average` is `$null` — handle the empty case first.'],
    },
    {
      id: 'log-errors', title: 'Search text with -match', tier: 2,
      prompt: "Write `Get-ErrorMessages` taking an array of log lines shaped `2025-03-09 ERROR Disk full`. Return just the **message** part of every line whose level is `ERROR` — here, `Disk full`. A message that merely contains the word ERROR on an `INFO` line must not match.",
      starter: `function Get-ErrorMessages {\n  param([string[]]$Lines)\n\n}\n`,
      solution: `function Get-ErrorMessages {\n  param([string[]]$Lines)\n  foreach ($line in $Lines) {\n    if ($line -match '^\\S+ ERROR (.+)$') { $Matches[1] }\n  }\n}\n`,
      tests: `$__log = @('2025-03-09 INFO Started', '2025-03-09 ERROR Disk full', '2025-03-10 WARN Slow query', '2025-03-10 ERROR Connection lost to db1', '2025-03-11 INFO Retrying after ERROR state')
T 'error messages only' @(Get-ErrorMessages -Lines $__log) @('Disk full', 'Connection lost to db1')
T 'no errors' @(Get-ErrorMessages -Lines @('2025-03-09 INFO fine')) @()`,
      hints: ['`$text -match $regex` returns true or false and fills the automatic `$Matches` table.', '`$Matches[1]` is the first capture group.', 'Anchor the pattern with `^` so `ERROR` must be the second word, not just anywhere.'],
    },
    {
      id: 'merge-hashtables', title: 'Merge settings', tier: 2,
      prompt: "Write `Merge-Settings` with `-Defaults` and `-Overrides`, both hashtables. Return a **new** hashtable containing every key from both; where a key is in both, the override wins. Neither input may be modified.",
      starter: `function Merge-Settings {\n  param([hashtable]$Defaults, [hashtable]$Overrides)\n\n}\n`,
      solution: `function Merge-Settings {\n  param([hashtable]$Defaults, [hashtable]$Overrides)\n  $result = @{}\n  foreach ($key in $Defaults.Keys) { $result[$key] = $Defaults[$key] }\n  foreach ($key in $Overrides.Keys) { $result[$key] = $Overrides[$key] }\n  $result\n}\n`,
      tests: `$__d = @{ Theme = 'light'; FontSize = 12; Wrap = $true }
$__o = @{ Theme = 'dark'; Tabs = 2 }
$__m = Merge-Settings -Defaults $__d -Overrides $__o
T 'override wins' $__m['Theme'] 'dark'
T 'defaults kept' $__m['FontSize'] 12
T 'new keys added' $__m['Tabs'] 2
T 'four keys in total' $__m.Count 4
T 'defaults not modified' $__d['Theme'] 'light'
T 'defaults not grown' $__d.Count 3
T 'a false override still wins' (Merge-Settings -Defaults $__d -Overrides @{ Wrap = $false })['Wrap'] $false`,
      hints: ['Start from a fresh `@{}` and copy keys in — defaults first, overrides second.', 'Hashtables are reference types: `$result = $Defaults` would make both names point at the same table.'],
    },
    {
      id: 'to-csv', title: 'Objects to CSV', tier: 2,
      prompt: "Write `ConvertTo-StaffCsv` taking `-Employees`. Return CSV **lines** (an array of strings) with the columns `Name` and `Salary` only, for employees sorted by name. Use `Select-Object` and `ConvertTo-Csv -NoTypeInformation`.",
      setup: EMPLOYEES,
      starter: `function ConvertTo-StaffCsv {\n  param($Employees)\n\n}\n`,
      solution: `function ConvertTo-StaffCsv {\n  param($Employees)\n  $Employees | Sort-Object -Property Name | Select-Object -Property Name, Salary | ConvertTo-Csv -NoTypeInformation\n}\n`,
      tests: `$__csv = @(ConvertTo-StaffCsv -Employees $__staff)
T 'header row' $__csv[0] '"Name","Salary"'
T 'first data row' $__csv[1] '"Ada","150000"'
T 'last data row' $__csv[-1] '"Linus","120000"'
T 'header plus six rows' $__csv.Count 7`,
      hints: ['`Select-Object Name, Salary` drops the other properties before conversion.', 'Without `-NoTypeInformation`, Windows PowerShell 5.1 adds a `#TYPE` line at the top.'],
    },
    {
      id: 'retry', title: 'Retry with try/catch', tier: 3,
      prompt: "Write `Invoke-WithRetry` with a script block `-Action` and an integer `-MaxAttempts`. Run the action; if it throws, try again, up to `MaxAttempts` times in total. Return the result of the first success. If every attempt fails, **re-throw the last error**.",
      starter: `function Invoke-WithRetry {\n  param([scriptblock]$Action, [int]$MaxAttempts = 3)\n\n}\n`,
      solution: `function Invoke-WithRetry {\n  param([scriptblock]$Action, [int]$MaxAttempts = 3)\n  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {\n    try {\n      return (& $Action)\n    }\n    catch {\n      if ($attempt -eq $MaxAttempts) { throw }\n    }\n  }\n}\n`,
      tests: `$script:__calls = 0
T 'returns the first success' (Invoke-WithRetry -Action { $script:__calls++; 'ok' } -MaxAttempts 3) 'ok'
T 'did not retry a success' $script:__calls 1
$script:__calls = 0
T 'keeps trying' (Invoke-WithRetry -Action { $script:__calls++; if ($script:__calls -lt 3) { throw 'not yet' }; "worked on try $($script:__calls)" } -MaxAttempts 5) 'worked on try 3'
$script:__calls = 0; $__msg = ''
try { Invoke-WithRetry -Action { $script:__calls++; throw "fail $($script:__calls)" } -MaxAttempts 4 | Out-Null } catch { $__msg = $_.Exception.Message }
T 'gives up after MaxAttempts' $script:__calls 4
T 're-throws the last error' $__msg 'fail 4'`,
      hints: ['A `for` loop counting attempts, with `try { return (& $Action) }` inside.', 'In a `catch` block, a bare `throw` re-throws the error you just caught.', 'Only re-throw on the final attempt; otherwise let the loop go round again.'],
    },
  ],
  drills: [
    { q: 'What flows down a PowerShell pipeline?', choices: ['Lines of text', '.NET objects with properties and methods', 'JSON strings', 'Bytes'], answer: 1, why: 'That is the difference from Bash: no parsing columns out of text. `Get-Process | Where-Object CPU -gt 10` filters on a real number.' },
    { q: 'Which operator tests equality?', choices: ['==', '-eq', '=', '==='], answer: 1, why: '`=` assigns. Comparisons are `-eq -ne -gt -ge -lt -le`; add `c` (`-ceq`) for case-sensitive.' },
    { q: 'What is `$_`?', choices: ['The last error', 'The current object in a pipeline script block', 'The script path', 'A null value'], answer: 1, why: 'In `Where-Object { $_.Length -gt 1MB }`, `$_` is each item in turn. `$PSItem` is the long name.' },
    { q: 'What does `"Total: $item.Price"` print if `$item.Price` is 5?', choices: ['Total: 5', 'Total: (the object).Price', 'An error', 'Total: $item.Price'], answer: 1, why: 'Only `$item` is expanded, then `.Price` is literal text. Use `"Total: $($item.Price)"`.' },
    { q: 'How do you discover what properties an object has?', choices: ['Get-Help', 'Pipe it to Get-Member', 'Get-Command', 'Show-Object'], answer: 1, why: '`Get-Process | Get-Member` lists every property and method — the fastest way to explore.' },
    { q: 'What is the naming convention for cmdlets and functions?', choices: ['camelCase', 'Verb-Noun, with an approved verb', 'snake_case', 'NOUN_VERB'], answer: 1, why: '`Get-Service`, `Set-Item`, `New-User`. `Get-Verb` lists the approved verbs.' },
    { q: 'What does `-ErrorAction Stop` do?', choices: ['Hides errors', 'Turns a non-terminating error into one that `try/catch` can catch', 'Stops the computer', 'Retries the command'], answer: 1, why: 'Many cmdlets only write an error and continue. Without `Stop`, your `catch` block never runs.' },
    { q: 'What does a function return?', choices: ['Only what follows `return`', 'Everything it writes to the output stream', 'Nothing unless declared', 'The last variable assigned'], answer: 1, why: 'Any un-captured value becomes output. A stray expression (or a method that returns something) pollutes your result — pipe it to `Out-Null`.' },
    { q: 'What does `Select-Object -ExpandProperty Name` give compared to `Select-Object Name`?', choices: ['The same thing', 'The raw values instead of objects with a Name property', 'Only the first value', 'A hashtable'], answer: 1, why: 'Without Expand you get objects; with it you get plain strings you can pass to other commands.' },
    { q: 'Which is `$null` handling you should prefer?', choices: ['$value -eq $null', '$null -eq $value', '$value == null', 'isnull($value)'], answer: 1, why: 'With an array on the left, `-eq` *filters* instead of comparing. Putting `$null` first always gives a boolean.' },
    { q: 'What does `Get-ChildItem | Where-Object Length -gt 1MB` use `1MB` as?', choices: ['A string', 'The number 1048576', 'A variable', 'An error'], answer: 1, why: 'KB, MB, GB, TB and PB are numeric suffixes built into the language.' },
    { q: 'What does `@()` around a command guarantee?', choices: ['It runs in parallel', 'The result is an array, even with zero or one item', 'It suppresses output', 'It sorts the result'], answer: 1, why: 'PowerShell unwraps single results. `@(...)` makes `.Count` and indexing behave predictably.' },
    { q: 'What does this output?', code: `$name = 'World'\n'Hello, $name'`, choices: ['Hello, World', 'Hello, $name', 'An error', 'Nothing'], answer: 1, why: 'Single-quoted strings are literal. Only double-quoted strings expand variables.' },
    { q: 'What does `$x = 1, 2, 3; $x.Count` return?', choices: ['1', '3', '6', 'An error'], answer: 1, why: 'The comma operator builds an array. `@()` is the explicit way to make one, including an empty one.' },
    { q: 'What does `Get-Help Get-Process -Examples` show?', choices: ['Running processes', 'Usage examples for that cmdlet', 'The source code', 'The process list schema'], answer: 1, why: 'Three discovery commands cover most needs: `Get-Help`, `Get-Command` and `Get-Member`.' },
    { q: 'What does `-WhatIf` do on a cmdlet like `Remove-Item`?', choices: ['Asks a question', 'Shows what would happen without doing it', 'Forces the action', 'Runs it twice'], answer: 1, why: 'A dry run. `-Confirm` instead asks before each change.' },
    { q: 'What is `$true -and $false -or $true`?', choices: ['False', 'True', 'An error', '$null'], answer: 1, why: '`-and` and `-or` have equal precedence and are evaluated left to right. Use parentheses when it matters.' },
    { q: 'What does `"5" + 3` give? And `3 + "5"`?', choices: ['8 and 8', '"53" and 8', '"53" and "35"', '8 and "35"'], answer: 1, why: 'The left operand decides the conversion: a string on the left concatenates, a number on the left adds.' },
    { q: 'How do you run a script in the current scope so its functions stay defined?', choices: ['.\\script.ps1', '. .\\script.ps1 (dot-sourcing)', '& .\\script.ps1', 'Start-Process script.ps1'], answer: 1, why: 'Running a script normally gives it a child scope that vanishes afterwards. Dot-sourcing loads it into yours.' },
    { q: 'What does `$ErrorActionPreference = "Stop"` do?', choices: ['Stops the computer', 'Makes every error terminating, so scripts halt and try/catch works', 'Hides errors', 'Logs errors to a file'], answer: 1, why: 'The default, `Continue`, prints the error and carries on — rarely what a script wants.' },
    { q: 'What is the difference between `Write-Host` and `Write-Output`?', choices: ['None', '`Write-Output` sends objects down the pipeline; `Write-Host` only draws on the screen', '`Write-Host` is faster', '`Write-Output` adds colour'], answer: 1, why: 'Text from `Write-Host` cannot be captured in a variable or piped (it goes to the information stream).' },
    { q: 'What does `Get-Process | Select-Object -First 5` do with the remaining processes?', choices: ['Sorts them', 'Stops the pipeline early once five have passed', 'Stores them in $rest', 'Errors'], answer: 1, why: 'Pipelines stream one object at a time, so `-First` can stop upstream commands without waiting for everything.' },
    { q: 'What does the execution policy protect against?', choices: ['Malware — it is a security boundary', 'Running scripts by accident; it is a safety catch, not a security boundary', 'Network attacks', 'Slow scripts'], answer: 1, why: 'Microsoft says so explicitly: anyone can bypass it. It stops a double-clicked script from running unintentionally.' },
    { q: 'What does `$array | Where-Object Name -like "S*"` use?', choices: ['A regular expression', 'A wildcard pattern: names starting with S', 'An exact match', 'A SQL query'], answer: 1, why: '`-like` uses `*` and `?` wildcards. `-match` is the regular-expression operator.' },
  ],
};

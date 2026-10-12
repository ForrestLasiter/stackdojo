'use strict';
// Scripts run in real Bash (Git Bash on Windows) inside a throwaway folder.
// The file that runs is: test helpers, then `setup`, then the learner's code,
// then `tests`. Helpers:  t NAME ACTUAL EXPECTED   tok NAME CMD…   tno NAME CMD…
// Authoring trap: these are JS template literals, so write \${var} and \\n.

const LOG = `printf '%s\\n' \\
  '10.0.0.1 GET /index.html 200 512' \\
  '10.0.0.2 GET /about.html 200 300' \\
  '10.0.0.1 GET /api/users 500 0' \\
  '10.0.0.3 POST /api/login 200 128' \\
  '10.0.0.1 GET /index.html 200 512' \\
  '10.0.0.2 GET /index.html 404 0' \\
  '10.0.0.4 GET /api/users 503 0' > access.log
`;
const LOG_NOTE = "\n\nEach line of the log looks like `10.0.0.1 GET /index.html 200 512` — IP, method, path, status, bytes.";

module.exports = {
  id: 'bash',
  name: 'Bash',
  short: 'Sh',
  blurb: 'Shell scripting: functions, quoting, exit codes, pipelines, and the text tools that glue Linux together.',
  lang: 'shell',
  runner: { kind: 'bash' },
  challenges: [
    {
      id: 'greet', title: 'Functions and arguments', tier: 1,
      prompt: "Write a function `greet` that prints `Hello, NAME!` using its first argument. With no argument, it prints `Hello, World!`.",
      starter: `greet() {\n  : # your code here\n}\n`,
      solution: `greet() {\n  echo "Hello, \${1:-World}!"\n}\n`,
      tests: `t 'greets by name' "$(greet Ada)" 'Hello, Ada!'
t 'defaults to World' "$(greet)" 'Hello, World!'
t 'keeps spaces in a quoted name' "$(greet 'Grace Hopper')" 'Hello, Grace Hopper!'`,
      hints: ['Arguments are `$1`, `$2`, … inside a function.', '`${1:-World}` means "the first argument, or `World` if it is empty or missing".'],
    },
    {
      id: 'sum', title: 'Arithmetic', tier: 1,
      prompt: "Write `sum` that prints the total of **all** its arguments. With no arguments it prints `0`.",
      starter: `sum() {\n  : # your code here\n}\n`,
      solution: `sum() {\n  local total=0 n\n  for n in "$@"; do\n    total=$((total + n))\n  done\n  echo "$total"\n}\n`,
      tests: `t 'adds two' "$(sum 2 3)" '5'
t 'adds many' "$(sum 1 2 3 4 5)" '15'
t 'handles negatives' "$(sum 10 -4)" '6'
t 'no arguments' "$(sum)" '0'`,
      hints: ['`"$@"` expands to every argument, each kept as its own word.', 'Arithmetic goes in `$(( ... ))`.'],
    },
    {
      id: 'is-even', title: 'Exit status', tier: 1,
      prompt: "In the shell, success and failure are exit codes: `0` is true. Write `is_even` that **returns** success when its argument is an even number and failure otherwise. It should print nothing.",
      starter: `is_even() {\n  : # your code here\n}\n`,
      solution: `is_even() {\n  (( $1 % 2 == 0 ))\n}\n`,
      tests: `tok '4 is even' is_even 4
tok '0 is even' is_even 0
tno '7 is odd' is_even 7
t 'prints nothing' "$(is_even 4; is_even 7)" ''
is_even 10 && __r=yes || __r=no
t 'usable in && / ||' "$__r" 'yes'`,
      hints: ['A function\'s exit status is that of its last command (or `return N`).', '`(( expression ))` succeeds when the expression is non-zero/true.'],
    },
    {
      id: 'file-kind', title: 'Testing files', tier: 1,
      prompt: "Write `kind` that prints `file` if its argument is a regular file, `dir` if it is a directory, and `missing` if it does not exist.",
      setup: `mkdir -p 'some dir'; echo hi > 'a file.txt'\n`,
      starter: `kind() {\n  : # your code here\n}\n`,
      solution: `kind() {\n  if [ -f "$1" ]; then\n    echo file\n  elif [ -d "$1" ]; then\n    echo dir\n  else\n    echo missing\n  fi\n}\n`,
      tests: `t 'regular file' "$(kind 'a file.txt')" 'file'
t 'directory' "$(kind 'some dir')" 'dir'
t 'missing' "$(kind nope.txt)" 'missing'`,
      hints: ['`[ -f path ]` tests for a regular file, `[ -d path ]` for a directory.', 'Always quote: `"$1"`. An unquoted path with a space becomes two arguments.'],
    },
    {
      id: 'count-lines', title: 'Count lines', tier: 1,
      prompt: "Write `count_lines` that prints **only the number** of lines in the file given as its argument.",
      setup: `printf 'one\\ntwo\\nthree\\n' > three.txt; : > empty.txt\n`,
      starter: `count_lines() {\n  : # your code here\n}\n`,
      solution: `count_lines() {\n  wc -l < "$1" | tr -d ' '\n}\n`,
      tests: `t 'three lines' "$(count_lines three.txt)" '3'
t 'empty file' "$(count_lines empty.txt)" '0'`,
      hints: ['`wc -l file` prints the count **and** the file name.', 'Feed the file on standard input instead — `wc -l < file` — and it has no name to print.'],
    },
    {
      id: 'countdown', title: 'Loops', tier: 1,
      prompt: "Write `countdown N` that prints the numbers from `N` down to `1`, one per line, followed by `Liftoff!`.",
      starter: `countdown() {\n  : # your code here\n}\n`,
      solution: `countdown() {\n  local i\n  for ((i = $1; i >= 1; i--)); do\n    echo "$i"\n  done\n  echo 'Liftoff!'\n}\n`,
      tests: `t 'from 3' "$(countdown 3)" $'3\\n2\\n1\\nLiftoff!'
t 'from 1' "$(countdown 1)" $'1\\nLiftoff!'
t 'from 0' "$(countdown 0)" 'Liftoff!'`,
      hints: ['Bash has a C-style loop: `for ((i = 3; i >= 1; i--)); do ... done`.', 'Or `while [ "$i" -ge 1 ]`.'],
    },
    {
      id: 'ext', title: 'Parameter expansion', tier: 1,
      prompt: "Without calling any external program, write two functions:\n\n- `ext` prints a file name's extension: `report.final.pdf` → `pdf`\n- `stem` prints the name without its last extension: `report.final.pdf` → `report.final`",
      starter: `ext() {\n  : # your code here\n}\n\nstem() {\n  : # your code here\n}\n`,
      solution: `ext() {\n  echo "\${1##*.}"\n}\n\nstem() {\n  echo "\${1%.*}"\n}\n`,
      tests: `t 'ext' "$(ext notes.txt)" 'txt'
t 'ext takes the last one' "$(ext report.final.pdf)" 'pdf'
t 'stem' "$(stem notes.txt)" 'notes'
t 'stem keeps earlier dots' "$(stem report.final.pdf)" 'report.final'
t 'no external commands' "$(declare -f ext stem | grep -cE 'sed|awk|cut|basename|rev')" '0'`,
      hints: ['`${var##pattern}` removes the **longest** match from the front; `${var%pattern}` removes the **shortest** from the end.', 'For the extension: strip everything up to the last dot — `${1##*.}`.'],
    },
    {
      id: 'shout', title: 'Transform text', tier: 1,
      prompt: "Write `shout` that reads text from **standard input** and prints it upper-cased, so it can be used in a pipeline: `echo hello | shout`.",
      starter: `shout() {\n  : # your code here\n}\n`,
      solution: `shout() {\n  tr '[:lower:]' '[:upper:]'\n}\n`,
      tests: `t 'one line' "$(echo hello | shout)" 'HELLO'
t 'several lines' "$(printf 'a b\\nc\\n' | shout)" $'A B\\nC'`,
      hints: ['A function inherits standard input, so a command inside it can simply read the pipe.', '`tr SET1 SET2` translates characters.'],
    },
    {
      id: 'join-by', title: 'Arrays', tier: 2,
      prompt: "Write `join_by SEP item…` that prints the items joined by the separator: `join_by , a b c` → `a,b,c`. The separator may be more than one character.",
      starter: `join_by() {\n  : # your code here\n}\n`,
      solution: `join_by() {\n  local sep="$1" out="" first=1 item\n  shift\n  for item in "$@"; do\n    if ((first)); then out="$item"; first=0; else out="$out$sep$item"; fi\n  done\n  echo "$out"\n}\n`,
      tests: `t 'commas' "$(join_by , a b c)" 'a,b,c'
t 'multi-character separator' "$(join_by ' | ' x y)" 'x | y'
t 'single item' "$(join_by , solo)" 'solo'
t 'items with spaces' "$(join_by - 'a b' c)" 'a b-c'
t 'nothing to join' "$(join_by ,)" ''`,
      hints: ['`shift` drops `$1`, so `"$@"` becomes just the items.', 'Build the string in a loop, adding the separator before every item except the first.'],
    },
    {
      id: 'safe-div', title: 'Errors go to stderr', tier: 2,
      prompt: "Write `safe_div A B` that prints the integer result of `A / B`.\n\nIf `B` is `0`, it must instead print `error: division by zero` to **standard error**, print nothing to standard output, and return status `2`.",
      starter: `safe_div() {\n  : # your code here\n}\n`,
      solution: `safe_div() {\n  if [ "$2" -eq 0 ]; then\n    echo 'error: division by zero' >&2\n    return 2\n  fi\n  echo $(($1 / $2))\n}\n`,
      tests: `t 'divides' "$(safe_div 20 4)" '5'
t 'integer division' "$(safe_div 7 2)" '3'
t 'nothing on stdout for zero' "$(safe_div 1 0 2>/dev/null)" ''
t 'message on stderr' "$(safe_div 1 0 2>&1 >/dev/null)" 'error: division by zero'
safe_div 1 0 >/dev/null 2>&1
t 'returns 2' "$?" '2'
safe_div 4 2 >/dev/null 2>&1
t 'returns 0 on success' "$?" '0'`,
      hints: ['`>&2` redirects a command\'s output to standard error.', '`return N` sets the function\'s exit status. Keeping errors off stdout means `$(safe_div …)` never captures an error message as if it were a result.'],
    },
    {
      id: 'service', title: 'case', tier: 2,
      prompt: "Write `service_action` taking one word:\n\n- `start` → prints `Starting…`\n- `stop` → prints `Stopping…`\n- `restart` or `reload` → prints `Restarting…`\n- anything else → prints `usage: service_action start|stop|restart` to standard error and returns `1`",
      starter: `service_action() {\n  : # your code here\n}\n`,
      solution: `service_action() {\n  case "$1" in\n    start) echo 'Starting…' ;;\n    stop) echo 'Stopping…' ;;\n    restart | reload) echo 'Restarting…' ;;\n    *)\n      echo 'usage: service_action start|stop|restart' >&2\n      return 1\n      ;;\n  esac\n}\n`,
      tests: `t 'start' "$(service_action start)" 'Starting…'
t 'stop' "$(service_action stop)" 'Stopping…'
t 'restart' "$(service_action restart)" 'Restarting…'
t 'reload is an alias' "$(service_action reload)" 'Restarting…'
t 'usage on stderr' "$(service_action dance 2>&1 >/dev/null)" 'usage: service_action start|stop|restart'
tno 'unknown action fails' service_action dance
tno 'no action fails' service_action`,
      hints: ['`case "$1" in pattern) commands ;; esac`.', 'Patterns can be alternatives: `a | b)`. `*)` is the catch-all.'],
    },
    {
      id: 'count-errors', title: 'grep', tier: 2,
      prompt: "Write `count_status FILE CODE` that prints how many requests in the log had exactly that status code." + LOG_NOTE,
      setup: LOG,
      starter: `count_status() {\n  : # your code here\n}\n`,
      solution: `count_status() {\n  awk -v code="$2" '$4 == code' "$1" | wc -l | tr -d ' '\n}\n`,
      tests: `t '200s' "$(count_status access.log 200)" '4'
t '404s' "$(count_status access.log 404)" '1'
t 'none' "$(count_status access.log 301)" '0'
t 'does not match bytes or IPs' "$(count_status access.log 512)" '0'`,
      hints: ['`grep -c pattern file` counts matching lines — but `grep 512` would also match the byte column.', 'Match the field, not the line: `awk \'$4 == 200\'` tests only the fourth column.', 'Pass a shell value into awk with `-v name="$value"`.'],
    },
    {
      id: 'top-ips', title: 'The classic pipeline', tier: 2,
      prompt: "Write `top_ips FILE N` that prints the `N` busiest client IPs, busiest first, each as `IP COUNT`." + LOG_NOTE + "\n\nFor the sample log, `top_ips access.log 2` prints:\n\n```\n10.0.0.1 3\n10.0.0.2 2\n```",
      setup: LOG,
      starter: `top_ips() {\n  : # your code here\n}\n`,
      solution: `top_ips() {\n  awk '{ print $1 }' "$1" | sort | uniq -c | sort -rn | head -n "$2" | awk '{ print $2, $1 }'\n}\n`,
      tests: `t 'top two' "$(top_ips access.log 2)" $'10.0.0.1 3\\n10.0.0.2 2'
t 'top one' "$(top_ips access.log 1)" '10.0.0.1 3'`,
      hints: ['The idiom: extract the column → `sort` → `uniq -c` → `sort -rn` → `head`.', '`uniq` only collapses *adjacent* duplicates, which is why the first `sort` is needed.', '`uniq -c` prints `COUNT VALUE` with padding; a final `awk` can swap and tidy.'],
    },
    {
      id: 'total-bytes', title: 'awk: sum a column', tier: 2,
      prompt: "Write `total_bytes FILE` that prints the sum of the bytes column (the 5th field) for requests with status `200` only." + LOG_NOTE,
      setup: LOG,
      starter: `total_bytes() {\n  : # your code here\n}\n`,
      solution: `total_bytes() {\n  awk '$4 == 200 { sum += $5 } END { print sum + 0 }' "$1"\n}\n`,
      tests: `t 'sums 200s' "$(total_bytes access.log)" '1452'
: > none.log
t 'empty log prints 0' "$(total_bytes none.log)" '0'`,
      hints: ['An awk program is `condition { action }` pairs, run for each line.', '`END { ... }` runs once after the last line.', 'An unset awk variable prints as an empty string; `sum + 0` forces a number.'],
    },
    {
      id: 'redact', title: 'sed: search and replace', tier: 2,
      prompt: "Write `redact FILE` that prints the file with every `password=VALUE` changed to `password=****`. The value runs until the next space or the end of the line. The file itself must not be modified.",
      setup: `printf '%s\\n' 'user=ada password=hunter2 role=admin' 'no secrets here' 'password=p@ss/w0rd' > app.conf\n`,
      starter: `redact() {\n  : # your code here\n}\n`,
      solution: `redact() {\n  sed -E 's/password=[^ ]+/password=****/g' "$1"\n}\n`,
      tests: `t 'masks values' "$(redact app.conf)" $'user=ada password=**** role=admin\\nno secrets here\\npassword=****'
t 'leaves the file alone' "$(grep -c hunter2 app.conf)" '1'`,
      hints: ["`sed 's/pattern/replacement/g' file` prints the edited text; without `-i` the file is untouched.", '`[^ ]+` means "one or more characters that are not a space" (needs `-E`).'],
    },
    {
      id: 'sum-file', title: 'Read a file line by line', tier: 2,
      prompt: "Write `sum_file FILE`. The file has one integer per line, but may also contain blank lines and comment lines starting with `#`. Print the sum of the numbers. Use a `while read` loop.",
      setup: `printf '%s\\n' '# monthly totals' '10' '' '25' '# refund' '-5' > nums.txt\n`,
      starter: `sum_file() {\n  : # your code here\n}\n`,
      solution: `sum_file() {\n  local total=0 line\n  while IFS= read -r line; do\n    [ -z "$line" ] && continue\n    [[ $line == \\#* ]] && continue\n    total=$((total + line))\n  done < "$1"\n  echo "$total"\n}\n`,
      tests: `t 'skips blanks and comments' "$(sum_file nums.txt)" '30'
tok 'uses a while read loop' grep -Eq 'while.*read' <(declare -f sum_file)`,
      hints: ['`while IFS= read -r line; do ... done < "$file"` is the safe way to read lines.', '`-r` stops backslashes being interpreted; `IFS=` preserves leading spaces.', 'Redirect the file into the loop with `< "$1"` rather than piping `cat` into it — a pipe runs the loop in a subshell and your total is lost.'],
    },
    {
      id: 'quoting-bug', title: 'Fix: the word-splitting bug', tier: 2,
      prompt: "**Bug hunt.** `count_files DIR` should print how many entries are in a directory. It works in testing and breaks in production — as soon as a folder or file name contains a space. Fix it. An empty directory should give `0`.",
      setup: `mkdir -p 'my docs' hollow; touch 'my docs/a.txt' 'my docs/final report.txt' 'my docs/notes v2 draft.md'\n`,
      starter: `count_files() {\n  local n=0\n  for f in $(ls $1); do\n    n=$((n + 1))\n  done\n  echo $n\n}\n`,
      solution: `count_files() {\n  local n=0 f\n  for f in "$1"/*; do\n    [ -e "$f" ] || continue\n    n=$((n + 1))\n  done\n  echo "$n"\n}\n`,
      tests: `t 'names with spaces' "$(count_files 'my docs' 2>/dev/null)" '3'
t 'empty directory' "$(count_files hollow 2>/dev/null)" '0'`,
      hints: ['Unquoted `$1` and `$(ls …)` are split on spaces: `final report.txt` becomes two loop items.', 'Never parse `ls`. Let the shell expand a glob instead: `for f in "$1"/*`.', 'A glob that matches nothing stays as the literal `dir/*` — guard with `[ -e "$f" ]`.'],
    },
    {
      id: 'backup', title: 'Loop over files', tier: 2,
      prompt: "Write `backup_confs DIR` that makes a copy of every `*.conf` file in the directory, named with `.bak` appended (`nginx.conf` → `nginx.conf.bak`). Other files are left alone. It must cope with spaces in file names, and do nothing — successfully — if there are no `.conf` files.",
      setup: `mkdir -p etc none; echo 'listen 80' > etc/nginx.conf; echo 'port 22' > 'etc/ssh d.conf'; echo x > etc/readme.txt; echo y > none/a.txt\n`,
      starter: `backup_confs() {\n  : # your code here\n}\n`,
      solution: `backup_confs() {\n  local f\n  for f in "$1"/*.conf; do\n    [ -e "$f" ] || continue\n    cp "$f" "$f.bak"\n  done\n}\n`,
      tests: `backup_confs etc
t 'copies content' "$(cat etc/nginx.conf.bak 2>/dev/null)" 'listen 80'
t 'handles spaces' "$(cat 'etc/ssh d.conf.bak' 2>/dev/null)" 'port 22'
tno 'ignores other files' test -e etc/readme.txt.bak
tok 'originals still there' test -f etc/nginx.conf
tok 'no .conf files is not an error' backup_confs none
t 'creates nothing odd' "$(ls none)" 'a.txt'`,
      hints: ['`for f in "$1"/*.conf; do cp "$f" "$f.bak"; done`.', 'With no matches the loop runs once with the literal pattern — skip it with `[ -e "$f" ] || continue`.'],
    },
    {
      id: 'make-config', title: 'Here-documents', tier: 2,
      prompt: "Write `make_config NAME PORT` that creates the file `NAME.conf` containing exactly these three lines, with the values filled in:\n\n```\n[server]\nname=NAME\nport=PORT\n```",
      starter: `make_config() {\n  : # your code here\n}\n`,
      solution: `make_config() {\n  cat > "$1.conf" <<EOF\n[server]\nname=$1\nport=$2\nEOF\n}\n`,
      tests: `make_config web 8080
t 'file contents' "$(cat web.conf 2>/dev/null)" $'[server]\\nname=web\\nport=8080'
make_config 'api gateway' 443
t 'name with a space' "$(cat 'api gateway.conf' 2>/dev/null)" $'[server]\\nname=api gateway\\nport=443'`,
      hints: ['A here-document feeds several lines to a command: `cat > file <<EOF` … `EOF`.', 'Variables are expanded inside it (unless you quote the marker: `<<\'EOF\'`).', 'The closing `EOF` must start at the very beginning of its line.'],
    },
    {
      id: 'is-ipv4', title: 'Validate with a regex', tier: 3,
      prompt: "Write `is_ipv4` that succeeds only for a valid dotted IPv4 address: four numbers, each 0–255, separated by dots, and nothing else.",
      starter: `is_ipv4() {\n  : # your code here\n}\n`,
      solution: `is_ipv4() {\n  [[ $1 =~ ^([0-9]{1,3})\\.([0-9]{1,3})\\.([0-9]{1,3})\\.([0-9]{1,3})$ ]] || return 1\n  local octet\n  for octet in "\${BASH_REMATCH[@]:1}"; do\n    ((10#$octet <= 255)) || return 1\n  done\n}\n`,
      tests: `tok 'ordinary address' is_ipv4 192.168.1.10
tok 'all zeros' is_ipv4 0.0.0.0
tok 'top of range' is_ipv4 255.255.255.255
tno 'octet too large' is_ipv4 256.1.1.1
tno 'too few parts' is_ipv4 10.0.0
tno 'too many parts' is_ipv4 1.2.3.4.5
tno 'letters' is_ipv4 a.b.c.d
tno 'trailing junk' is_ipv4 '1.2.3.4; rm -rf /'
tno 'empty' is_ipv4 ''
tok 'leading zero is still a number' is_ipv4 10.0.0.08`,
      hints: ['`[[ $x =~ regex ]]` matches a regular expression; captured groups land in the `BASH_REMATCH` array.', 'The regex can check the *shape*; the 0–255 range is easier as arithmetic on each captured part.', 'A leading zero makes Bash read a number as octal (`08` is an error). Force base ten with `10#$n`.'],
    },
    {
      id: 'getopts', title: 'getopts', tier: 3,
      prompt: "Write `parse` that understands the options `-v` (a flag) and `-o FILE` (takes a value), followed by one positional argument. It prints a single line:\n\n`verbose=0|1 output=FILE file=ARG`\n\n`parse -v -o out.txt in.txt` → `verbose=1 output=out.txt file=in.txt`. An unknown option makes it return `1`. Use the `getopts` builtin.",
      starter: `parse() {\n  : # your code here\n}\n`,
      solution: `parse() {\n  local verbose=0 output="" opt OPTIND=1\n  while getopts 'vo:' opt 2>/dev/null; do\n    case "$opt" in\n      v) verbose=1 ;;\n      o) output="$OPTARG" ;;\n      *) return 1 ;;\n    esac\n  done\n  shift $((OPTIND - 1))\n  echo "verbose=$verbose output=$output file=$1"\n}\n`,
      tests: `t 'all options' "$(parse -v -o out.txt in.txt)" 'verbose=1 output=out.txt file=in.txt'
t 'defaults' "$(parse in.txt)" 'verbose=0 output= file=in.txt'
t 'options in the other order' "$(parse -o x.log -v data.csv)" 'verbose=1 output=x.log file=data.csv'
t 'combined value form' "$(parse -oz.txt f)" 'verbose=0 output=z.txt file=f'
tno 'unknown option fails' parse -x in.txt
t 'works when called twice in one shell' "$(parse -v a >/dev/null; parse -v b)" 'verbose=1 output= file=b'`,
      hints: ["`while getopts 'vo:' opt; do case \"$opt\" in ... esac; done` — the colon after `o` means it takes a value, delivered in `$OPTARG`.", 'After the loop, `shift $((OPTIND - 1))` discards the parsed options so `$1` is the first positional.', '`getopts` keeps its position in the global `OPTIND`. Declare `local OPTIND=1` or a second call starts where the first stopped.'],
    },
    {
      id: 'word-freq', title: 'Word frequency', tier: 3,
      prompt: "Write `word_freq FILE` that prints each distinct word in the file with its count, as `WORD COUNT`, sorted alphabetically. Words are separated by spaces or newlines, and counting is case-insensitive (print them lower-case).",
      setup: `printf 'the cat The dog\\nthe end Cat\\n' > words.txt\n`,
      starter: `word_freq() {\n  : # your code here\n}\n`,
      solution: `word_freq() {\n  tr '[:upper:]' '[:lower:]' < "$1" | tr -s ' ' '\\n' | grep -v '^$' | sort | uniq -c | awk '{ print $2, $1 }'\n}\n`,
      tests: `t 'counts words' "$(word_freq words.txt)" $'cat 2\\ndog 1\\nend 1\\nthe 3'`,
      hints: ['Get one word per line first: `tr -s " " "\\n"` turns runs of spaces into newlines.', 'Then it is the same shape as the busiest-IPs pipeline: `sort | uniq -c`.'],
    },
    {
      id: 'with-temp', title: 'Clean up after yourself', tier: 3,
      prompt: "Write `run_with_temp CMD ARG…`:\n\n1. create a temporary file with `mktemp` and export its path as `TMPFILE`\n2. run the given command with its arguments\n3. delete the temporary file — **whether the command succeeded or failed**\n4. return the command's own exit status",
      starter: `run_with_temp() {\n  : # your code here\n}\n`,
      solution: `run_with_temp() {\n  TMPFILE="$(mktemp)"\n  export TMPFILE\n  "$@"\n  local status=$?\n  rm -f "$TMPFILE"\n  return "$status"\n}\n`,
      tests: `__seen=''
__probe() { [ -f "$TMPFILE" ] && __seen="$TMPFILE"; echo "$1" > "$TMPFILE"; return "$2"; }
run_with_temp __probe hello 0
t 'success status passes through' "$?" '0'
tok 'the temp file existed during the command' test -n "$__seen"
tno 'and is gone afterwards' test -e "$__seen"
run_with_temp __probe hello 7
t 'failure status passes through' "$?" '7'
tno 'cleaned up after a failure too' test -e "$__seen"
t 'arguments are passed intact' "$(run_with_temp printf '%s|' 'a b' c)" 'a b|c|'`,
      hints: ['`"$@"` runs the arguments as a command, preserving each argument exactly.', 'Save `$?` into a variable *immediately* — the next command overwrites it.'],
    },
    {
      id: 'boss-report', title: 'Boss: log report', tier: 3,
      prompt: "Write `report FILE` that prints exactly four lines summarising an access log:\n\n```\nrequests: 7\nerrors: 2\nclients: 4\ntop: /index.html\n```\n\n- `requests` — total lines\n- `errors` — requests with a status of 500 or above\n- `clients` — number of distinct IPs\n- `top` — the most requested path" + LOG_NOTE,
      setup: LOG,
      starter: `report() {\n  : # your code here\n}\n`,
      solution: `report() {\n  local file="$1"\n  echo "requests: $(wc -l < "$file" | tr -d ' ')"\n  echo "errors: $(awk '$4 >= 500' "$file" | wc -l | tr -d ' ')"\n  echo "clients: $(awk '{ print $1 }' "$file" | sort -u | wc -l | tr -d ' ')"\n  echo "top: $(awk '{ print $3 }' "$file" | sort | uniq -c | sort -rn | head -n 1 | awk '{ print $2 }')"\n}\n`,
      tests: `t 'full report' "$(report access.log)" $'requests: 7\\nerrors: 2\\nclients: 4\\ntop: /index.html'
printf '%s\\n' '1.1.1.1 GET /a 200 1' '1.1.1.1 GET /b 502 1' '1.1.1.1 GET /b 200 1' > small.log
t 'a different log' "$(report small.log)" $'requests: 3\\nerrors: 1\\nclients: 1\\ntop: /b'`,
      hints: ['Four small pipelines, each inside `$( … )` in an `echo`.', '`sort -u` sorts and de-duplicates in one step.', 'Everything here reuses a tool from an earlier challenge: `wc -l`, an awk condition, `sort | uniq -c | sort -rn | head -n 1`.'],
    },
    {
      id: 'max', title: 'Largest argument', tier: 1,
      prompt: "Write `max` that prints the largest of its integer arguments. It must work with negative numbers.",
      starter: `max() {\n  : # your code here\n}\n`,
      solution: `max() {\n  local best="$1" n\n  for n in "$@"; do\n    if [ "$n" -gt "$best" ]; then best="$n"; fi\n  done\n  echo "$best"\n}\n`,
      tests: `t 'picks the largest' "$(max 3 9 4)" '9'
t 'largest first' "$(max 12 5 1)" '12'
t 'all negative' "$(max -8 -3 -5)" '-3'
t 'single argument' "$(max 7)" '7'`,
      hints: ['Start with the first argument as the best so far, then compare every argument against it.', 'Numeric comparisons in `[ ]` are `-gt`, `-lt`, `-eq`. `>` inside `[ ]` is a file redirect.'],
    },
    {
      id: 'repeat', title: 'Repeat a string', tier: 1,
      prompt: "Write `repeat STR N` that prints `STR` repeated `N` times on one line, with nothing between the copies. `repeat ab 3` → `ababab`. Zero times prints an empty line.",
      starter: `repeat() {\n  : # your code here\n}\n`,
      solution: `repeat() {\n  local out="" i\n  for ((i = 0; i < $2; i++)); do\n    out="$out$1"\n  done\n  echo "$out"\n}\n`,
      tests: `t 'three times' "$(repeat ab 3)" 'ababab'
t 'a separator line' "$(repeat - 10)" '----------'
t 'zero times' "$(repeat x 0)" ''
t 'keeps spaces' "$(repeat 'a ' 2)x" 'a a x'`,
      hints: ['Build the result in a variable inside a loop: `out="$out$1"`.'],
    },
    {
      id: 'snake', title: 'To snake_case', tier: 1,
      prompt: "Write `to_snake` that prints its argument lower-cased with every space replaced by an underscore: `to_snake 'Quarterly Sales Report'` → `quarterly_sales_report`.",
      starter: `to_snake() {\n  : # your code here\n}\n`,
      solution: `to_snake() {\n  echo "$1" | tr '[:upper:] ' '[:lower:]_'\n}\n`,
      tests: `t 'spaces and capitals' "$(to_snake 'Quarterly Sales Report')" 'quarterly_sales_report'
t 'already fine' "$(to_snake report)" 'report'
t 'one word, capitals' "$(to_snake README)" 'readme'`,
      hints: ['`tr` maps characters in one set to the matching position in another.', 'Or use parameter expansion: `${1,,}` lower-cases, `${var// /_}` replaces every space.'],
    },
    {
      id: 'nth-line', title: 'One line from a file', tier: 1,
      prompt: "Write `nth_line FILE N` that prints only line number `N` of the file (the first line is 1). If the file has fewer lines, print nothing.",
      setup: `printf 'alpha\\nbeta\\ngamma\\n' > greek.txt\n`,
      starter: `nth_line() {\n  : # your code here\n}\n`,
      solution: `nth_line() {\n  sed -n "$2p" "$1"\n}\n`,
      tests: `t 'second line' "$(nth_line greek.txt 2)" 'beta'
t 'first line' "$(nth_line greek.txt 1)" 'alpha'
t 'last line' "$(nth_line greek.txt 3)" 'gamma'
t 'past the end' "$(nth_line greek.txt 9)" ''`,
      hints: ['`sed -n \'2p\' file` prints only line 2: `-n` silences the default output, `p` prints the addressed line.', 'Use double quotes so the shell fills in the number: `"$2p"`.', '`head -n N file | tail -n 1` also works — but check what it does past the end of the file.'],
    },
    {
      id: 'csv-column', title: 'Pull a column from CSV', tier: 2,
      prompt: "Write `csv_column FILE N` that prints column `N` (counting from 1) of a comma-separated file, **skipping the header line**.",
      setup: `printf 'name,dept,salary\\nAda,Eng,150000\\nKen,Sales,90000\\nDennis,Support,70000\\n' > staff.csv\n`,
      starter: `csv_column() {\n  : # your code here\n}\n`,
      solution: `csv_column() {\n  tail -n +2 "$1" | cut -d, -f"$2"\n}\n`,
      tests: `t 'first column' "$(csv_column staff.csv 1)" $'Ada\\nKen\\nDennis'
t 'third column' "$(csv_column staff.csv 3)" $'150000\\n90000\\n70000'
t 'pipes into other tools' "$(csv_column staff.csv 3 | sort -n | head -n 1)" '70000'`,
      hints: ['`tail -n +2 file` prints from line 2 onward — everything but the header.', '`cut -d, -f2` splits on commas and keeps field 2.'],
    },
    {
      id: 'kv-get', title: 'Read a config value', tier: 2,
      prompt: "Write `conf_get FILE KEY` that prints the value for `KEY` from a `key=value` config file.\n\n- lines starting with `#` are comments\n- a value may itself contain `=`\n- if the key is not present, print nothing and return a non-zero status",
      setup: `printf '%s\\n' '# database settings' 'host=db.internal' 'port=5432' '#port=9999' 'url=postgres://db/app?ssl=true' 'hostname=other' > app.conf\n`,
      starter: `conf_get() {\n  : # your code here\n}\n`,
      solution: `conf_get() {\n  local line\n  line="$(grep -m 1 "^$2=" "$1")" || return 1\n  echo "\${line#*=}"\n}\n`,
      tests: `t 'simple value' "$(conf_get app.conf port)" '5432'
t 'exact key, not a prefix' "$(conf_get app.conf host)" 'db.internal'
t 'value containing =' "$(conf_get app.conf url)" 'postgres://db/app?ssl=true'
tno 'missing key fails' conf_get app.conf password
t 'missing key prints nothing' "$(conf_get app.conf password)" ''
tok 'found key succeeds' conf_get app.conf host`,
      hints: ['Anchor the search: `grep "^port="` matches only lines that *start* with `port=`, which also skips `#port=`.', '`${line#*=}` removes everything up to the **first** `=`, keeping later ones.', '`grep` exits non-zero when it finds nothing — pass that on.'],
    },
    {
      id: 'dedupe', title: 'Remove duplicate lines', tier: 2,
      prompt: "Write `dedupe FILE` that prints the file with duplicate lines removed, **keeping the original order** and the first occurrence of each line. (`sort -u` is out: it reorders.)",
      setup: `printf '%s\\n' 'ada@x.test' 'ken@x.test' 'ada@x.test' 'linus@x.test' 'ken@x.test' > emails.txt\n`,
      starter: `dedupe() {\n  : # your code here\n}\n`,
      solution: `dedupe() {\n  awk '!seen[$0]++' "$1"\n}\n`,
      tests: `t 'first occurrences, original order' "$(dedupe emails.txt)" $'ada@x.test\\nken@x.test\\nlinus@x.test'
printf 'b\\na\\nb\\n' > ba.txt
t 'does not sort' "$(dedupe ba.txt)" $'b\\na'`,
      hints: ['awk has associative arrays. `seen[$0]++` counts how often the current line has appeared.', '`!seen[$0]++` is true only the first time — and an awk condition with no action prints the line.'],
    },
    {
      id: 'disk-alert', title: 'Filter by a threshold', tier: 2,
      prompt: "Write `over_threshold LIMIT`. It reads lines like `/var 87%` from **standard input** (mount point, then usage) and prints the mount points whose usage is `LIMIT` percent or more.",
      setup: `printf '%s\\n' '/ 42%' '/var 87%' '/home 80%' '/tmp 5%' '/data 100%' > df.txt\n`,
      starter: `over_threshold() {\n  : # your code here\n}\n`,
      solution: `over_threshold() {\n  awk -v limit="$1" '{ pct = $2; sub(/%/, "", pct); if (pct + 0 >= limit + 0) print $1 }'\n}\n`,
      tests: `t 'at or above 80' "$(over_threshold 80 < df.txt)" $'/var\\n/home\\n/data'
t 'at or above 100' "$(over_threshold 100 < df.txt)" '/data'
t 'compares numbers, not text' "$(over_threshold 9 < df.txt)" $'/\\n/var\\n/home\\n/data'
t 'nothing over' "$(printf '/ 1%%\\n' | over_threshold 50)" ''`,
      hints: ['With no file argument, `awk` reads standard input.', 'Strip the `%` before comparing: `sub(/%/, "", pct)`.', 'Adding `+ 0` forces awk to compare as numbers. As text, `"9"` is greater than `"87"`.'],
    },
    {
      id: 'count-ext', title: 'find', tier: 2,
      prompt: "Write `count_ext DIR EXT` that prints how many **files** under `DIR`, at any depth, have the extension `EXT` (given without the dot). Directories do not count, even if their name matches.",
      setup: `mkdir -p proj/src/lib proj/docs 'proj/odd dir.js'; touch proj/a.js proj/src/b.js proj/src/lib/c.js proj/src/x.ts proj/docs/readme.md 'proj/src/my file.js'\n`,
      starter: `count_ext() {\n  : # your code here\n}\n`,
      solution: `count_ext() {\n  find "$1" -type f -name "*.$2" | wc -l | tr -d ' '\n}\n`,
      tests: `t 'js files at every depth' "$(count_ext proj js)" '4'
t 'ts files' "$(count_ext proj ts)" '1'
t 'none' "$(count_ext proj py)" '0'`,
      hints: ['`find DIR -type f -name "*.js"` lists matching regular files recursively.', 'Quote the pattern, or the shell expands `*.js` itself before `find` ever sees it.'],
    },
    {
      id: 'rename-ext', title: 'Batch rename', tier: 2,
      prompt: "Write `rename_ext DIR OLD NEW` that renames every `*.OLD` file directly inside `DIR` to `*.NEW` — `notes.txt` → `notes.md`. Files with other extensions are untouched, names with spaces must work, and having nothing to rename is not an error.",
      setup: `mkdir -p rn empty; echo one > rn/notes.txt; echo two > 'rn/to do.txt'; echo three > rn/keep.log; echo four > rn/archive.txt.bak\n`,
      starter: `rename_ext() {\n  : # your code here\n}\n`,
      solution: `rename_ext() {\n  local f\n  for f in "$1"/*."$2"; do\n    [ -e "$f" ] || continue\n    mv "$f" "\${f%.$2}.$3"\n  done\n}\n`,
      tests: `rename_ext rn txt md
t 'renamed, content intact' "$(cat rn/notes.md 2>/dev/null)" 'one'
t 'handles spaces' "$(cat 'rn/to do.md' 2>/dev/null)" 'two'
tno 'old names are gone' test -e rn/notes.txt
tok 'other extensions untouched' test -f rn/keep.log
tok 'only the final extension counts' test -f rn/archive.txt.bak
tok 'nothing to rename is fine' rename_ext empty txt md
t 'creates nothing odd' "$(ls empty | wc -l | tr -d ' ')" '0'`,
      hints: ['Loop over the glob `"$1"/*."$2"` and `mv` each file.', '`${f%.txt}` strips a trailing `.txt`; append the new extension.', 'Guard against the unmatched-glob case with `[ -e "$f" ] || continue`.'],
    },
    {
      id: 'retry', title: 'Retry until it works', tier: 3,
      prompt: "Write `retry N CMD ARG…` that runs the command up to `N` times, stopping at the first success.\n\n- returns `0` as soon as the command succeeds\n- if every attempt fails, returns the exit status of the **last** attempt\n- runs the command with its arguments exactly as given",
      starter: `retry() {\n  : # your code here\n}\n`,
      solution: `retry() {\n  local max="$1" status=0 i\n  shift\n  for ((i = 0; i < max; i++)); do\n    "$@" && return 0\n    status=$?\n  done\n  return "$status"\n}\n`,
      tests: `__n=0
__flaky() { __n=$((__n + 1)); [ "$__n" -ge "$1" ]; }
__n=0; retry 5 __flaky 3
t 'succeeds on the third try' "$?" '0'
t 'stopped as soon as it worked' "$__n" '3'
__n=0; retry 2 __flaky 9
t 'gives up after N tries' "$__n" '2'
__fail7() { return 7; }
retry 3 __fail7
t 'returns the last failure status' "$?" '7'
__n=0; retry 4 __flaky 1
t 'no retry when the first try works' "$__n" '1'
t 'passes arguments intact' "$(retry 1 printf '%s|' 'a b' c)" 'a b|c|'`,
      hints: ['`shift` after saving `$1`, and `"$@"` is the command with its arguments.', '`"$@" && return 0` leaves on success.', 'Capture `$?` on the very next line after a failure — any other command overwrites it.'],
    },
  ],
  drills: [
    { q: 'What does `$?` hold?', choices: ['The process id', 'The exit status of the last command', 'The number of arguments', 'The script name'], answer: 1, why: '0 means success. `$$` is the PID, `$#` the argument count, `$0` the script name.' },
    { q: 'What is the difference between `"$@"` and `$*`?', choices: ['None', '`"$@"` keeps each argument as a separate word; unquoted `$*` re-splits on spaces', '`$*` is faster', '`"$@"` only works in functions'], answer: 1, why: 'With an argument like "my file.txt", `"$@"` passes one word and `$*` passes two.' },
    { q: 'What does `2>&1` do?', choices: ['Runs two commands', 'Sends standard error to wherever standard output currently goes', 'Appends to a file', 'Redirects input'], answer: 1, why: 'File descriptor 2 is stderr, 1 is stdout. Order matters: `> out.log 2>&1` captures both.' },
    { q: 'Single vs double quotes: what does `echo \'$HOME\'` print?', choices: ['Your home directory', 'The literal text $HOME', 'Nothing', 'An error'], answer: 1, why: 'Single quotes are literal. Double quotes still expand `$variables` and `$(commands)`.' },
    { q: 'What does `set -e` do in a script?', choices: ['Enables echo', 'Exits the script as soon as a command fails', 'Exports all variables', 'Enables extended globs'], answer: 1, why: 'Without it a script carries on after an error. Often paired as `set -euo pipefail`.' },
    { q: 'Why is `[ $name = "ada" ]` risky?', choices: ['`=` should be `==`', 'If `$name` is empty or has spaces, the test gets the wrong number of words', '`[` is deprecated', 'It is case-insensitive'], answer: 1, why: 'Unquoted, an empty variable vanishes and `[ = "ada" ]` is a syntax error. Quote it, or use `[[ ]]`.' },
    { q: 'What does `cmd1 && cmd2` do?', choices: ['Runs both in parallel', 'Runs cmd2 only if cmd1 succeeded', 'Runs cmd2 only if cmd1 failed', 'Pipes cmd1 into cmd2'], answer: 1, why: '`&&` is "and then"; `||` is "or else"; `;` runs both regardless; `|` connects output to input.' },
    { q: 'What does `#!/usr/bin/env bash` on line 1 do?', choices: ['It is a comment only', 'Tells the OS which interpreter should run the file', 'Imports environment variables', 'Enables strict mode'], answer: 1, why: 'The shebang. `env bash` finds bash on the PATH instead of assuming /bin/bash.' },
    { q: 'What does `chmod +x deploy.sh` change?', choices: ['The owner', 'Marks the file as executable', 'Makes it read-only', 'Its extension'], answer: 1, why: 'Without the execute bit you get "Permission denied" running `./deploy.sh`.' },
    { q: 'What does `grep -r "TODO" .` do?', choices: ['Replaces TODO', 'Searches every file under the current folder for TODO', 'Reverses the match', 'Counts lines'], answer: 1, why: '`-r` recurses, `-i` ignores case, `-n` shows line numbers, `-v` inverts, `-c` counts.' },
    { q: 'Why does a variable set inside `cat f | while read x; do n=1; done` vanish afterwards?', choices: ['Variables are read-only in loops', 'Each side of a pipe runs in a subshell', 'while loops reset variables', 'It does not vanish'], answer: 1, why: 'Changes in a subshell die with it. Use `while read …; done < f` to keep the loop in the current shell.' },
    { q: 'What does `local` do inside a function?', choices: ['Makes the variable read-only', 'Limits the variable to that function', 'Exports it', 'Makes it an array'], answer: 1, why: 'Without `local`, every variable in a function is global and can clobber the caller\'s.' },
    { q: 'What does `>>` do differently from `>`?', choices: ['Nothing', 'Appends to the file instead of overwriting it', 'Redirects stderr', 'Creates a pipe'], answer: 1, why: '`>` truncates first — a typo here is how log files get erased.' },
    { q: 'What does this print?', code: `name="World"\necho 'Hello, $name' "Hello, $name"`, choices: ['Hello, World Hello, World', 'Hello, $name Hello, World', 'Hello, $name Hello, $name', 'An error'], answer: 1, why: 'Single quotes are literal; double quotes expand variables.' },
    { q: 'Why does `x = 5` fail in Bash?', choices: ['Numbers need quotes', 'Spaces around `=` make it run a command named x', 'x is reserved', 'It does not fail'], answer: 1, why: 'Assignment has no spaces: `x=5`. With spaces, the shell looks for a program called `x`.' },
    { q: 'What does `$#` hold?', choices: ['The last exit status', 'The number of arguments', 'The process id', 'All the arguments'], answer: 1, why: '`$#` is the count, `$@` the arguments themselves, `$0` the script name, `$?` the last status.' },
    { q: 'What does `set -u` do?', choices: ['Unsets all variables', 'Makes using an undefined variable an error', 'Enables unicode', 'Runs as another user'], answer: 1, why: 'It turns a typo like `rm -rf "$TMPDRI/"` from a disaster into an immediate failure.' },
    { q: 'What is the difference between `$(cmd)` and backticks?', choices: ['Backticks are faster', 'They do the same thing; `$(…)` nests cleanly and is easier to read', '`$(…)` runs in the background', 'Backticks capture stderr'], answer: 1, why: 'Both substitute a command\'s output. Prefer `$(…)`.' },
    { q: 'What does `|` connect?', choices: ['Two files', 'One command\'s standard output to the next command\'s standard input', 'Standard error to a file', 'Two shells'], answer: 1, why: 'Errors bypass the pipe unless you add `2>&1` (or use `|&`).' },
    { q: 'What does `chmod 644 file` set?', choices: ['Everyone can do anything', 'Owner can read and write; everyone else can only read', 'Only the owner can read', 'The file becomes executable'], answer: 1, why: 'Each digit is read(4) + write(2) + execute(1), for owner, group and others in turn.' },
    { q: 'What does `&` at the end of a command do?', choices: ['Runs it as root', 'Runs it in the background', 'Repeats it', 'Chains another command'], answer: 1, why: 'The shell returns straight away. `wait` blocks until background jobs finish; `$!` is the last one\'s PID.' },
    { q: 'How do `[[ ]]` and `[ ]` differ?', choices: ['They are identical', '`[[ ]]` is a Bash keyword: no word splitting, plus `=~` and pattern matching', '`[ ]` is newer', '`[[ ]]` only compares numbers'], answer: 1, why: '`[ ]` is the portable POSIX test command. In Bash scripts `[[ ]]` is safer with unquoted variables.' },
    { q: 'What does `2>/dev/null` do?', choices: ['Deletes the output file', 'Throws away error messages', 'Throws away all output', 'Redirects input'], answer: 1, why: '`/dev/null` discards whatever is written to it. `>/dev/null 2>&1` silences everything.' },
    { q: 'What does `export VAR=value` change compared with `VAR=value`?', choices: ['Nothing', 'Child processes started from this shell can see the variable', 'It makes the variable read-only', 'It saves it permanently'], answer: 1, why: 'Unexported variables stay private to the current shell. Neither survives closing the terminal.' },
    { q: 'What does `set -o pipefail` change?', choices: ['Pipes run faster', 'A pipeline fails if any command in it fails, not just the last', 'Pipes are disabled', 'Errors go to stdout'], answer: 1, why: 'Without it, `false | true` reports success and `set -e` never notices the failure.' },
  ],
};

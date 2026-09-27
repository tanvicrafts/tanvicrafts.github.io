<!-- flostep:begin — managed by `npx flostep init`; re-run it to update -->
## Flostep CLI

Flostep makes diagrams people can **step through** one interaction at a time, share by link, or embed. Use it when the user wants a walkable, shareable diagram of how something works — a request crossing services, an approval chain, a customer journey. Not for class, ER, state or Gantt diagrams, and it does not emit markup to paste into a file.

Run `npx flostep` (Node 20+). Authenticated via `FLOSTEP_TOKEN`, or `flostep login` for a browser flow.

### Format

One step per line, in the order it happens:

```
Frontend -> API: POST /login
API -> Database: check credentials
Database -> API: user record
API -> Frontend: returns JWT
```

Components are created the first time they are named — reuse a name to reference the same box, and give genuinely different components different names. The `: description` is optional. Point a component at itself for internal work. Participants can be people, teams, or systems, not only software.

Limits: 40 components, 120 steps. Run `flostep syntax` for the authoritative grammar.

### Building a diagram

Write the whole flow at once — atomic, and one call instead of eight. **Pipe it in; do not create files** in the user's repository unless they asked for a diagram that lives there:

```bash
npx flostep create --title "Checkout" --share <<'EOF'
Customer -> API: POST /checkout
API -> Payments: charge card
API -> Customer: order confirmed
EOF
# ✓ Created #42 Checkout
# https://flostep.dev/s/rEFdW8GSDwQ      <- give the user this
```

`--share` returns the public link in the same call. Add `--json` for a parseable result.

For a diagram that already exists, share it on its own:

```bash
npx flostep share 42            # prints the public link
npx flostep share 42 --embed    # iframe URL, for a docs page
```

Only use `push` when the user wants the diagram **committed to their repo** as a text file — it writes the file's id into `.flostep.json`, which is a change to their project:

```bash
npx flostep push docs/checkout.flostep
```

To rewrite an existing diagram, read it, transform it, pipe it back:

```bash
npx flostep show 42 | sed 's/Redis/Session Cache/' | npx flostep update 42
```

Or change one step at a time when you have no local file:

```bash
npx flostep show 42                              # read it first
npx flostep step add 42 "API -> Cache: read session"
npx flostep step add 42 "Client -> API: retry" --at 3
npx flostep step rm 42 5
npx flostep node rename 42 "Redis" "Session Cache"
```

### Folders

Folders are shared by a team and addressed by name. File a diagram only when the user asks you to organise it:

```bash
npx flostep folder list --json            # names and diagram counts
npx flostep folder create "Payments"      # returns the folder if it already exists
npx flostep move 42 "Payments"            # file it; --none takes it out
npx flostep list --folder "Payments" --json
```

`flostep folder rename` and `flostep folder delete` exist too — ask before either; a delete un-files every diagram in it for the whole team, and needs `--yes` without a terminal.

### Reading

```bash
npx flostep list --json         # ids, titles, urls
npx flostep show 42             # the steps, plain text
npx flostep step list 42 --json # numbered steps
npx flostep node list 42 --json # components, first-appearance order
npx flostep whoami --json       # which workspace you're writing to
```

### Rules

- **Read before you write.** `create`, `update`, `push`, `step` and `node` all replace the whole diagram; `show` first so you don't discard steps.
- **Don't leave files behind.** `create`/`update` write nothing to disk. Reach for `push`/`pull` only when the user wants the diagram tracked in their repository.
- **Never invent a diagram id.** Get it from `list`, `push`, or the user.
- **Exit codes**: `0` success, `1` error, `2` usage. Errors go to stderr with the reason.
- **There is no `node add` and no `--type`.** The format cannot express an unconnected component or an explicit type — types are inferred from the name. Add a component by naming it in a step.
- **Notes, positions and hand-drawn curves are not in the text format** and are dropped by any write. Say so if the user has them.
- Ask before `delete`. It needs `--yes` when there's no terminal, and it cannot be undone.
<!-- flostep:end -->

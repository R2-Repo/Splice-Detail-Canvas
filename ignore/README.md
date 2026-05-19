# Local backup copy

The folder `snapshot/` is a **full copy of the project files** (no `.git`, no `node_modules`, no `dist`, not the `ignore` tree itself) so you can **zip or copy this `ignore` folder** later as a working backup.

- **Not committed to Git** — `ignore/snapshot/` is listed in the root `.gitignore` to avoid duplicating the whole project in the remote.
- **Refresh** after you change the repo, from the repository root:

  ```bash
  rm -rf ignore/snapshot
  mkdir -p ignore/snapshot
  tar -cf - \
    --exclude='./.git' \
    --exclude='./ignore' \
    --exclude='./node_modules' \
    --exclude='./dist' \
    . | (cd ignore/snapshot && tar -xf -)
  ```

After a refresh, run `npm install` inside `ignore/snapshot` if you need a runnable copy there.

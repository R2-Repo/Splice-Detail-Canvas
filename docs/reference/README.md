# Reference materials

Drop **non-code** materials here for you and Cursor agents to use when defining and building the app.

This folder is **not** bundled into the production app unless you explicitly import files from it in `src/`.

## Subfolders

| Folder | Use for |
|--------|---------|
| [`examples/`](./examples/) | Sample docs, specs, PDFs, markdown notes, exported graphs |
| [`images/`](./images/) | Screenshots, mockups, diagrams, icons for reference |
| [`resources/`](./resources/) | Links lists, spreadsheets, data samples, other assets |

## Tips

- Prefer descriptive filenames (`splice-node-mockup.png`, `workflow-v1.json`).
- Keep large binaries reasonable for git; use Git LFS if files grow large.
- When asking an agent to match a design, point to a specific file path in this folder.
- Do not put secrets or credentials here.

## For agents

Read files in this folder **only when** the user references them or when `docs/agent/SCOPE.md` points to them. Summarize relevant details in `CONTEXT.md` if they affect active work.

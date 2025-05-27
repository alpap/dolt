# Publish a new Node.js/Typescript project at NPM

Pick a name for the new project:

```sh
PROJECT=new-lib-name
```

Then:

```sh
gh repo create $PROJECT --public
gh repo clone $PROJECT
cd $PROJECT
npx degit IlyaSemenov/npm-package-starter --force
```

Search and replace `mylib` with the new project name.

---

Install development dependencies:

```sh
pnpm i
```

---

Write sources under `src`, build with:

```sh
pnpm build
```

---

Write tests under `src` and `tests` as `*.test.ts`, run with:

```sh
pnpm test
```

---

Prepare package documentation:

```sh
mv README.lib.md README.md
```

Fill `description` in `package.json`.

---

Commit:

```sh
git add .
git commit -m "Initial release"
```

---

Setup Github Actions:

```sh
gh repo view --web
```

Under Settings > Secrets and variables > Actions > New repository secret:

- Add new secret `NPM_TOKEN`.

Under Settings > Actions > General > Workflow permissions:

- Choose: Read and write permissions.
- Enable: Allow GitHub Actions to create and approve pull requests.

Push repo:

```sh
git push -u origin
```

Under Pull Requests, open the new "Version Packages" PR and click Rebase and Merge.

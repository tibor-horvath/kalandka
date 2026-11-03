# Deploying Kalandka

Kalandka is a static PWA: `npm run build` produces `dist/`, and that folder is all there is to host.
It runs on **Azure Static Web Apps** (Free tier), created from [`infra/main.bicep`](../infra/main.bicep) and filled with the Static Web Apps CLI.
Every push to `main` is built and tested by GitHub Actions (`.github/workflows/ci.yml`), and only a release is deployed; see [CI](../README.md#ci).
Manual deploys with the SWA CLI still work for previews and emergencies.

## What gets created

| Resource | Notes |
| --- | --- |
| Resource group (`kalandka-rg`) | Created by hand, once. |
| Static web app (`kalandka`) | Free tier, `westeurope`. Content is served from Azure's global edge. |
| Custom domain (`www.kalandka.hu`) | Skipped when `customDomain` is passed as an empty string. |

Free tier costs nothing and includes HTTPS, two custom domains and three preview environments.

## Prerequisites

- An Azure subscription where you can create resource groups.
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) with Bicep (`az bicep install`).
- Node.js and `npm install` done in the repo.

```bash
az login
az account set --subscription "<subscription name or id>"
```

## First deploy

1. Create the resource group:

   ```bash
   az group create -n kalandka-rg -l westeurope
   ```

2. Create the static web app:

   ```bash
   az deployment group create -g kalandka-rg -f infra/main.bicep --parameters customDomain=''
   ```

   The empty `customDomain` skips the domain for now: it can only be bound once its CNAME points at the site (see [Custom domain](#custom-domain)).
   The output `url` is the site's default address (`https://<random-name>.azurestaticapps.net`).

3. Connect GitHub Actions to the site (once):

   ```bash
   az staticwebapp secrets list -n kalandka --query properties.apiKey -o tsv
   ```

   In the GitHub repo, open Settings → Environments, create an environment named `production`, and add the value as the secret `AZURE_STATIC_WEB_APPS_API_TOKEN`.
   Optionally add required reviewers to approve each deploy.

   Under **Deployment branches and tags**, choose *Selected branches and tags* and add `main`, so only `main` can deploy.

4. In the GitHub repo, open Settings → Actions → General and turn on **Allow GitHub Actions to create and approve pull requests**, so the release PR can be opened.

5. Run the CI workflow by hand on `main` to deploy.

### Bicep parameters

| Parameter | Default | Meaning |
| --- | --- | --- |
| `name` | `kalandka` | Name of the static web app. |
| `location` | `westeurope` | Region of the resource (`westeurope`, `centralus`, `eastus2`, `westus2`, `eastasia`). |
| `sku` | `Free` | `Free` or `Standard`. Standard adds an SLA and more custom domains. |
| `customDomain` | `www.kalandka.hu` | Custom subdomain; its CNAME must already resolve. Empty skips it. |
| `tags` | `{ app: 'kalandka' }` | Resource tags. |

Pass them with `--parameters`, e.g. `--parameters sku=Standard`.
Re-running the deployment is safe; it only changes what differs.

## Releasing a new version

Merging to `main` does not change the live site. The `CI` workflow builds and tests the commit, then [release-please](https://github.com/googleapis/release-please) opens a release PR, or updates the one already open, with the next version number and the changelog.
Only `feat`, `fix`, `refactor` and `perf` commits appear in the changelog; a release PR is not opened for the other types on their own.

To release, merge the release PR. Its `CI` run tags `vX.Y.Z`, creates the GitHub release, and the **Deploy to production** job uploads the `dist/` from that run to the site.
The job only runs when the build, tests and secret scan passed, and the run page links the live URL.
To redeploy `main` without a release, run the `CI` workflow from the Actions tab on `main`. That also ships anything merged since the last release.

By hand, from a local checkout:

```bash
npm test
npm run build
npx @azure/static-web-apps-cli deploy ./dist --env production --deployment-token "$(az staticwebapp secrets list -n kalandka --query properties.apiKey -o tsv)"
```

The deployment token gives write access to the site. Do not commit it or paste it into chat; fetch it as above when needed.

### How the update reaches tablets

`public/staticwebapp.config.json` (copied into `dist/`) makes `sw.js`, `registerSW.js`, `manifest.webmanifest` and `index.html` uncacheable, while hashed files in `/assets/` are cached for a year. It also sets the security headers on every response: a Content Security Policy that allows only the site's own files, the camera only for the site itself (QR transfer), no referrer and no framing. A new external resource (a CDN font, an online recording) has to be added to the policy, or the browser blocks it.
The service worker precaches every file the app uses (`workbox.globPatterns` in `vite.config.ts`) on the first visit, and serves the app from that cache afterwards, online or not.
So an installed tablet makes no requests while playing; the only traffic is the update check.
The service worker uses `prompt` mode, driven by `src/lib/update.ts`: when the app is opened, and when it is brought back from the background or left open (at most every five minutes), it requests `sw.js` once to look for a new version.
A new version is downloaded in the background, and only the files whose content changed are fetched again.
The new version takes over only on the home screen: the app reloads into it two seconds after the child is back in the garden, never during a game or in the parents' corner.
A tablet that stays offline keeps the old version until it is next online.

To check a release: open **Szülői sarok → Beállítások**; the version is at the bottom of the page.
For more detail, in the browser's dev tools under Application → Service workers confirm the new worker is active, or compare the `index-*.js` file name in Network with the one in `dist/assets/`.

## Trying a build before release

Upload to a preview environment instead of production:

```bash
npx @azure/static-web-apps-cli deploy ./dist --env preview --deployment-token "<token>"
```

The CLI prints the preview URL. Remove it when done:

```bash
az staticwebapp environment delete -n kalandka --environment-name preview
```

## Custom domain

The site answers on `www.kalandka.hu` and `kalandka.hu`, which fill both custom domain slots of the Free tier.
The domain is registered at Rackhost, but its DNS is hosted on Cloudflare (Free plan): the nameservers at Rackhost are `chin.ns.cloudflare.com` and `yadiel.ns.cloudflare.com`, so DNS changes are made only in the Cloudflare dashboard.
Rackhost's own DNS editor has no effect while those nameservers are set.

Records in Cloudflare:

| Type | Name | Content | Proxy status |
| --- | --- | --- | --- |
| CNAME | `www` | default hostname (`<random-name>.azurestaticapps.net`) | DNS only |
| CNAME | `@` | default hostname | DNS only |
| TXT | `@` | Azure's validation token for `kalandka.hu` | — |

Keep both CNAMEs on **DNS only** (grey cloud). With Cloudflare's proxy on, traffic no longer reaches Azure directly and the free certificate can fail to renew.
Keep the TXT record too; Azure may check it again when it renews the apex certificate.

**Subdomain (`www.kalandka.hu`):**

1. In Cloudflare, add the `www` CNAME above.
2. Wait until it resolves (`nslookup www.kalandka.hu`).
3. Redeploy the Bicep (`az deployment group create -g kalandka-rg -f infra/main.bicep`); `customDomain` defaults to `www.kalandka.hu`. Azure validates the CNAME and issues the certificate (can take a few minutes up to an hour).

**Apex domain (`kalandka.hu`):** needs TXT validation, which the Bicep file does not do. Add it with the CLI:

```bash
az staticwebapp hostname set -n kalandka --hostname kalandka.hu --validation-method dns-txt-token --no-wait
az staticwebapp hostname show -n kalandka --hostname kalandka.hu --query validationToken -o tsv
```

Put the token in the TXT record, then add the `@` CNAME. DNS does not allow a CNAME on the apex, so Cloudflare flattens it: it resolves the default hostname itself and answers with Azure's addresses.
Static Web Apps offers no stable A record for this site, and Rackhost's DNS supports neither ALIAS records nor CNAME flattening; that is why the DNS is on Cloudflare.

**Link previews:** the Open Graph tags in `index.html` need the public origin to give crawlers absolute URLs. Set the `SITE_URL` repository variable (Settings → Secrets and variables → Actions → Variables, e.g. `https://www.kalandka.hu`); CI passes it to the build. Locally, put it in the environment or a `.env` file; without it the tags use root-relative paths, which some sites (Facebook) ignore.

## Rolling back

Quickest: revert the bad commit on `main`, then merge the release PR that follows; the pipeline deploys the result.

Within 7 days (the build artifact's retention), you can also open the last good release's `CI` run on `main` in the Actions tab and re-run its **Deploy to production** job, which uploads that run's build again.
The next release deploys over it, so revert the bad commit too.

Or by hand: check out the last good commit, build and deploy it:

```bash
git checkout <good-commit>
npm ci && npm run build
npx @azure/static-web-apps-cli deploy ./dist --env production --deployment-token "<token>"
git checkout main
```

## Removing everything

```bash
az group delete -n kalandka-rg
```

This deletes the site and its custom domain bindings. DNS records at your provider stay and should be removed by hand.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Tablets still show the old version | They have not been online and opened the app since the deploy (an app kept open checks at most every five minutes); or `sw.js` was cached by a proxy. Check its `cache-control` header is `no-cache`. |
| `deploy` fails with an auth error | Token was reset or belongs to another site. Fetch it again with `az staticwebapp secrets list` and update the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret of the `production` environment. |
| Deploy job fails with "deployment_token was not provided" | The secret is missing, or was added at repo level under another name. It must be called `AZURE_STATIC_WEB_APPS_API_TOKEN`, in the `production` environment or the repo. |
| Custom domain stuck in "Validating" | DNS record not yet visible, the record is proxied (orange cloud) in Cloudflare, or the apex TXT record is missing. |
| Fonts, icons or sounds missing offline | Their file type is not in `workbox.globPatterns` in `vite.config.ts`. The build prints how many files it precached (`precache N entries`). |
| Home-screen icon wrong or blank | PNG icons are generated from `public/icon.svg` at build time by `pwa-assets.config.ts`; edit the SVG, not the PNGs. |

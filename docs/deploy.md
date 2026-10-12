# Deploying Kalandka

Kalandka is a static PWA: `npm run build` produces `dist/`, and that folder is all there is to host.
It runs on **Azure Static Web Apps** (Free tier), created from [`infra/main.bicep`](../infra/main.bicep) and filled with the Static Web Apps CLI.
There is no CI pipeline; deploys are run by hand.

## What gets created

| Resource | Notes |
| --- | --- |
| Resource group (`kalandka-rg`) | Created by hand, once. |
| Static web app (`kalandka`) | Free tier, `westeurope`. Content is served from Azure's global edge. |
| Custom domain (optional) | Only when the `customDomain` parameter is set. |

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
   az deployment group create -g kalandka-rg -f infra/main.bicep
   ```

   The output `url` is the site's default address (`https://<random-name>.azurestaticapps.net`).

3. Build and upload the app (same as every later release, see below).

### Bicep parameters

| Parameter | Default | Meaning |
| --- | --- | --- |
| `name` | `kalandka` | Name of the static web app. |
| `location` | `westeurope` | Region of the resource (`westeurope`, `centralus`, `eastus2`, `westus2`, `eastasia`). |
| `sku` | `Free` | `Free` or `Standard`. Standard adds an SLA and more custom domains. |
| `customDomain` | empty | A subdomain such as `www.kalandka.hu`. |
| `tags` | `{ app: 'kalandka' }` | Resource tags. |

Pass them with `--parameters`, e.g. `--parameters customDomain=www.kalandka.hu`.
Re-running the deployment is safe; it only changes what differs.

## Releasing a new version

```bash
npm test
npm run build
npx @azure/static-web-apps-cli deploy ./dist --env production --deployment-token "$(az staticwebapp secrets list -n kalandka --query properties.apiKey -o tsv)"
```

The deployment token gives write access to the site. Do not commit it or paste it into chat; fetch it as above when needed.

### How the update reaches tablets

`public/staticwebapp.config.json` (copied into `dist/`) makes `sw.js`, `registerSW.js`, `manifest.webmanifest` and `index.html` uncacheable, while hashed files in `/assets/` are cached for a year.
The service worker is registered with `autoUpdate`: the next time the app is opened online it fetches the new version and reloads into it.
A tablet that stays offline keeps the old version until it is next online.

To check a release: open the site, then in the browser's dev tools under Application → Service workers confirm the new worker is active, or compare the `index-*.js` file name in Network with the one in `dist/assets/`.

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

**Subdomain (e.g. `www.kalandka.hu`):**

1. At the DNS provider, add a CNAME from `www` to the default hostname (without `https://`).
2. Wait until it resolves (`nslookup www.kalandka.hu`).
3. Redeploy the Bicep with `--parameters customDomain=www.kalandka.hu`. Azure validates the CNAME and issues the certificate (can take a few minutes up to an hour).

**Apex domain (e.g. `kalandka.hu`):** needs TXT validation, which the Bicep file does not do. Add it with the CLI:

```bash
az staticwebapp hostname set -n kalandka --hostname kalandka.hu --validation-method dns-txt-token --no-wait
az staticwebapp hostname show -n kalandka --hostname kalandka.hu --query validationToken -o tsv
```

Put the token in a TXT record at `kalandka.hu`, then point the apex at the site with an ALIAS/ANAME record (or an A record to the IP shown in the portal under Custom domains).

## Rolling back

There is no one-click rollback for CLI deploys. Check out the last good commit, build and deploy it:

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
| Tablets still show the old version | They have not been online and opened the app since the deploy; or `sw.js` was cached by a proxy. Check its `cache-control` header is `no-cache`. |
| `deploy` fails with an auth error | Token was reset or belongs to another site. Fetch it again with `az staticwebapp secrets list`. |
| Custom domain stuck in "Validating" | DNS record not yet visible, or a CNAME used for an apex domain. |
| Fonts or icons missing offline | Their file type is not in `workbox.globPatterns` in `vite.config.ts`. |

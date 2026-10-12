// Hosting for Kalandka: a static PWA (vite build output in dist/) on Azure Static Web Apps.
// The app has no backend, so the Free tier is enough.

@description('Name of the static web app.')
param name string = 'kalandka'

@description('Region for the static web app resource. Content is served from the global edge regardless.')
@allowed([
  'westeurope'
  'centralus'
  'eastus2'
  'westus2'
  'eastasia'
])
param location string = 'westeurope'

@description('Free is enough for a static app; Standard adds an SLA, private endpoints and more custom domains.')
@allowed([
  'Free'
  'Standard'
])
param sku string = 'Free'

@description('Optional custom subdomain, e.g. www.kalandka.hu. Its CNAME must already point at the default hostname. Apex domains need TXT validation; see docs/deploy.md.')
param customDomain string = ''

param tags object = {
  app: 'kalandka'
}

resource site 'Microsoft.Web/staticSites@2024-04-01' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    // Deployed from the built dist/ folder with the SWA CLI, not linked to a repo.
    allowConfigFileUpdates: true
    stagingEnvironmentPolicy: 'Enabled'
  }
}

resource domain 'Microsoft.Web/staticSites/customDomains@2024-04-01' = if (!empty(customDomain)) {
  parent: site
  name: empty(customDomain) ? 'placeholder' : customDomain
  properties: {}
}

output name string = site.name
output url string = 'https://${site.properties.defaultHostname}'

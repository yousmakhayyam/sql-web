param location string = resourceGroup().location
param sqlServerName string
param sqlAdmin string
@secure()
param sqlPassword string
param databaseName string
param webAppName string
param sku string = 'B1'

resource sqlServer 'Microsoft.Sql/servers@2022-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdmin
    administratorLoginPassword: sqlPassword
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  name: databaseName
  parent: sqlServer
  location: location
  sku: {
    name: 'Basic'
    tier: 'Basic'
    capacity: 5
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 2147483648
    sampleName: 'AdventureWorksLT'
  }
}

resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '${webAppName}-plan'
  location: location
  sku: {
    name: sku
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: webAppName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      appSettings: [
        {
          name: 'DB_USER'
          value: sqlAdmin
        }
        {
          name: 'DB_PASSWORD'
          value: sqlPassword
        }
        {
          name: 'DB_SERVER'
          value: '${sqlServerName}.${environment().suffixes.sqlServerHostname}'
        }
        {
          name: 'DB_DATABASE'
          value: databaseName
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '18-lts'
        }
      ]
    }
  }
}

// ❌ Removed this output to avoid secret exposure warning
// output sqlConnStrWithoutPassword string = '...'

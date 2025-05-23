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
  sku: {
    name: 'GP_Gen5_2' // adjust SKU based on needs
    tier: 'GeneralPurpose'
    capacity: 2
    family: 'Gen5'
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  name: '${sqlServerName}/${databaseName}'
  location: location
  parent: sqlServer
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
          name: 'DB_CONNECTION'
          value: 'Server=tcp:${sqlServerName}.database.windows.net,1433;Initial Catalog=${databaseName};Persist Security Info=False;User ID=${sqlAdmin};Password=${sqlPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
        }
      ]
    }
  }
}

output sqlConnStr string = 'Server=tcp:${sqlServerName}.database.windows.net,1433;Initial Catalog=${databaseName};Persist Security Info=False;User ID=${sqlAdmin};Password=${sqlPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'

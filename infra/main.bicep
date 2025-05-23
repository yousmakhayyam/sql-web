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
  name: '${sqlServerName}/${databaseName}'
  location: location
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 2147483648
    sampleName: 'AdventureWorksLT'
  }
  parent: sqlServer
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
    }
  }
  // dependsOn not necessary here because referencing appServicePlan.id ensures dependency
}

output sqlConnStr string = 'Server=tcp:${sqlServerName}.database.windows.net,1433;Initial Catalog=${databaseName};Persist Security Info=False;User ID=${sqlAdmin};Password=REDACTED;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'

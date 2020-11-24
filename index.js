const { join } = require('path')
const logger = require('consola').withTag('@dewib/parcel-stores-locator')

const middleware = require('./middleware')

module.exports = function (moduleOptions) {
  const { parcelStoresLocator = {} } = Object.assign({}, this.options)
  Object.assign(parcelStoresLocator, moduleOptions)

  const providers = Object.keys(parcelStoresLocator.providers).reduce((acc, provider) => {
    const Provider = require(`./providers/${provider}`)

    acc[provider] = new Provider({ config: parcelStoresLocator.providers[provider], logger })

    return acc
  }, {})

  this.addServerMiddleware({
    path: 'parcel-stores-locator',
    handler: middleware({ providers })
  })

  // Inject components
  this.nuxt.hook('components:dirs', (dirs) => {
    dirs.push({
      path: join(__dirname, 'components'),
      prefix: 'parcel-stores-locator'
    })
  })

  // Inject providers for SSR Plugin to avoid middleware
  this.nuxt.hook('vue-renderer:context', (ssrContext) => {
    ssrContext.parcelStoresLocatorsProviders = providers
  })

  // Inject plugin
  this.addPlugin({
    src: join(__dirname, './plugin.js'),
    fileName: 'parcelStoresLocatorPlugin.js',
    options: {
      providers: JSON.stringify(Object.keys(providers)),
      gmap: JSON.stringify(parcelStoresLocator.gmap)
    }
  })
}

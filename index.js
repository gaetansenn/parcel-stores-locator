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
}

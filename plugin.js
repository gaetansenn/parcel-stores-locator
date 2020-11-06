const logger = require('consola').withTag('@dewib/parcel-stores-locator')

export default (ctx, inject) => {
  const helper = {
    async getLocators ({ provider, ...content }) {
      if (process.server) {
        const providers = ctx.ssrContext.parcelStoresLocatorsProviders

        if (!providers[provider]) logger.error(`Unable to find provider ${provider}`)
        else providers[provider].getStores(content)
      } else {
        const providers = JSON.parse('<%= options.providers %>')

        if (!providers.includes(provider)) logger.error(`Unable to find provider ${provider}`)
        else {
          const response = await fetch(`/parcel-stores-locator/${provider}`, {
            method: 'POST',
            body: JSON.stringify(content),
            headers: {
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) return response.json()
          else logger.error(`Unable to get stores : ${response}`)
        }
      }
    }
  }
  
  inject('parcelStoresLocator', helper)
}
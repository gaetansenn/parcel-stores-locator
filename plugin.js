export default (ctx, inject) => {
  const helper = {
    async getLocators ({ provider, ...content }) {
      if (process.server) {
        const providers = ctx.ssrContext.parcelStoresLocatorsProviders

        if (!providers[provider]) return [`Unable to find provider ${provider}`]
        else return providers[provider].getStores(content)
      } else {
        const providers = JSON.parse('<%= options.providers %>')

        if (!providers.includes(provider)) return [`Unable to find provider ${provider}`]
        else {
          const response = await fetch(`/parcel-stores-locator/${provider}`, {
            method: 'POST',
            body: JSON.stringify(content),
            headers: {
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) return [false, await response.json()]
          else return [`Unable to get stores : ${response}`]
        }
      }
    },
    getGeolocation (options = {}) {
      return new Promise((resolve) => {
        if (!('geolocation' in window.navigator)) resolve(['browser-support'])
        else
          window.navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve([false, {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                altitude: position.coords.altitude,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                accuracy: position.coords.accuracy
              }])
            },
            () => {
              resolve(['position-access'])
            },
            options
          )
      })
    }
  }

  inject('parcelStoresLocator', helper)
}

const https = require('https')

function mapResponse (response) {
  if (!response.LocatorResponse.SearchResults) return ['Unable to parse UPS response']

  return [false, response.LocatorResponse.SearchResults.DropLocation.map(location => ({
    id: location.LocationID,
    lat: location.Geocode.Latitude,
    lng: location.Geocode.Longitude,
    distance: location.Distance.Value,
    name: location.AddressKeyFormat.ConsigneeName,
    address: {
      street: location.AddressKeyFormat.AddressLine,
      city: location.AddressKeyFormat.PoliticalDivision2,
      postalcode: location.AddressKeyFormat.PostcodePrimaryLow
    },
    hours: {
      short: location.StandardHoursOfOperation,
      days: location.OperatingHours.StandardHours.DayOfWeek.map(h => ({
        openAt: h.OpenHours,
        closeAt: h.CloseHours
      }))
    }
  }))]
}

/**
 *
 *
 * @export
 * @class Ups Service
 * @extends {Model}
 */
module.exports = class UpsService {
  constructor ({ config, logger }) {
    const requiredFields = ['licence', 'user', 'password', 'countryCode', 'locale']

    if (requiredFields.filter(field => Object.keys(config).includes(field)).length !== requiredFields.length) logger.error(new Error('please provide all required fields for ups configuration in nuxt.config.js'))

    this.config = config
  }

  /**
   * Get stores
   * @param {Object} params
   */
  async getStores ({ type, limit, ...content }) {
    let request = {
      AccessRequest: {
        AccessLicenseNumber: this.config.licence,
        UserId: this.config.user,
        Password: this.config.password
      },
      LocatorRequest: {
        UnitOfMeasurement: {
          Code: this.config.unit
        },
        Request: {
          RequestAction: 'Locator',
          RequestOption: '64'
        },
        OriginAddress: {
          AddressKeyFormat: {
            CountryCode: this.config.countryCode
          }
        },
        Translate: {
          Locale: this.config.locale
        },
        LocationSearchCriteria: {
          MaximumListSize: limit || this.config.limit,
          AccessPointSearch: {
            AccessPointStatus: '01'
          }
        }
      }
    }

    if (type === 'geocode')
      request.LocatorRequest.OriginAddress.Geocode = {
        Latitude: content.lat,
        Longitude: content.long
      }
    else
      request.LocatorRequest.OriginAddress.AddressKeyFormat.SingleLineAddress = content.address

    request = JSON.stringify(request)

    try {
      const response = await new Promise((resolve, reject) => {
        const req = https.request({
          protocol: 'https:',
          hostname: 'onlinetools.ups.com',
          path: '/rest/Locator',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': request.length
          }
        }, (res) => {
          let data = ''

          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            resolve(JSON.parse(data))
          })
        }).on('error', reject)

        req.write(request)
        req.end()
      })

      // Catch errors
      if (response.LocatorResponse.Response.Error || response.LocatorResponse.Response.ResponseStatusCode !== '1')
        return [`'Error from UPS: ${response.LocatorResponse.Response}`]
      else return mapResponse(response)
    } catch (err) {
      return [err]
    }
  }
}

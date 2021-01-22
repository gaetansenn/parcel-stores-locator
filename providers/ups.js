const https = require('https')

function weekDays (locale) {
  const date = new Date(2020, 10, 29)

  return Array.from(Array(7).keys()).map(() => {
    const day = date.toLocaleString(locale, { weekday: 'long' }).substring(0, 3).toLowerCase()

    date.setDate(date.getDate() + 1)

    return day.substring(0, 1).toUpperCase() + day.substring(1)
  })
}

function mapResponse (response, locale) {
  if (!response.LocatorResponse.SearchResults) return ['Unable to parse UPS response']

  const _weekDays = weekDays(locale)

  return [false, response.LocatorResponse.SearchResults.DropLocation.map((location) => {
    const _location = {
      id: location.LocationID,
      lat: parseFloat(location.Geocode.Latitude),
      lng: parseFloat(location.Geocode.Longitude),
      distance: parseFloat(location.Distance.Value),
      name: location.AddressKeyFormat.ConsigneeName,
      address: {
        street: location.AddressKeyFormat.AddressLine,
        city: location.AddressKeyFormat.PoliticalDivision2,
        postcode: location.AddressKeyFormat.PostcodePrimaryLow
      },
      hours: {
        short: location.StandardHoursOfOperation,
        days: location.OperatingHours.StandardHours.DayOfWeek
      }
    }

    if (location.OperatingHours.StandardHours.HoursType === '10')
      _location.hours.days = location.OperatingHours.StandardHours.DayOfWeek.map(h => ({
        openAt: Array.isArray(h.OpenHours) ? h.OpenHours : [h.OpenHours],
        closeAt: Array.isArray(h.CloseHours) ? h.CloseHours : [h.CloseHours]
      })).reduce((accu, value, index) => {
        if (!value.openAt[0]) {
          accu.push(false)

          return accu
        }

        const hours = value.openAt.reduce((accHour, hour, indexHours) => {
          function parseHour (time) {
            const hour = (time.substring(1, 2) === 0) ? time.substring(0, 1) : time.substring(0, 2)
            const minutes = time.substring(2, 4)

            return `${hour}h${minutes}`
          }

          accHour.push(`${parseHour(hour)} - ${parseHour(value.closeAt[indexHours])}`)

          return accHour
        }, [])

        accu.push(`${_weekDays[index]}: ${hours.join(', ')}`)

        return accu
      }, [])

    return _location
  })]
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
  async getStores ({ type, limit, locale, ...content }) {
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
          Locale: locale || this.config.locale
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
        Latitude: `${content.lat}`,
        Longitude: `${content.lng}`
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
        return [`Error from UPS: ${JSON.stringify(response.LocatorResponse.Response)}`]
      else return mapResponse(response)
    } catch (err) {
      return [err]
    }
  }
}

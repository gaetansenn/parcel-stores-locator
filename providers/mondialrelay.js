const https = require('https')
const crypto = require('crypto')
const xml2js = require('xml2js')

const weekDays = (locale) => {
  const date = new Date(2020, 10, 29)

  return Array.from(Array(7).keys()).map(() => {
    const day = date.toLocaleString(locale, { weekday: 'long' }).substring(0, 3).toLowerCase()

    date.setDate(date.getDate() + 1)

    return day.substring(0, 1).toUpperCase() + day.substring(1)
  })
}

const mapResponse = (response, locale) => {
  if (parseInt(response.stat) !== 0) return [`Mondial Relay error code ${response.stat}`]
  if (!response.pointsrelais.pointrelais_details) return [false, []]

  const _weekDays = weekDays(locale)

  return [false, response.pointsrelais.pointrelais_details.map((location) => {
    return {
      address: {
        city: location.ville.trim(),
        postcode: location.cp,
        street: location.lgadr3.trim(),
        complement: location.lgadr4.trim()
      },
      distance: location.distance,
      hours: {
        days: [
          generateHours(location.horaires_dimanche, _weekDays[0]),
          generateHours(location.horaires_lundi, _weekDays[1]),
          generateHours(location.horaires_mardi, _weekDays[2]),
          generateHours(location.horaires_mercredi, _weekDays[3]),
          generateHours(location.horaires_jeudi, _weekDays[4]),
          generateHours(location.horaires_vendredi, _weekDays[5]),
          generateHours(location.horaires_samedi, _weekDays[6])
        ]
      },
      id: location.num,
      lat: parseFloat(location.latitude.replace(',', '.')),
      lng: parseFloat(location.longitude.replace(',', '.')),
      name: `${location.lgadr1.trim()}${location.lgadr2.trim()}`
    }
  })]
}

const generateHours = (hours, weekDay) => {
  const schedules = hours.string
  const details = schedules.reduce((acc, schedule) => {
    if (schedule !== '0000') acc.push(`${schedule.slice(0, 2)}h${schedule.slice(2)}`)
    return acc
  }, [])
  if (details.length === 0) return false
  if (details.length === 2) return `${weekDay}: ${details[0]} - ${details[1]}`
  if (details.length === 4) return `${weekDay}: ${details[0]} - ${details[1]}, ${details[2]} - ${details[3]}`
}

const toJson = (xml) => {
  const options = { explicitArray: false, tagNameProcessors: [xml2js.processors.stripPrefix], normalizeTags: true, mergeAttrs: true }
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, options, (err, result) => {
      if (err !== null) return reject(err)
      resolve(result.envelope.body.wsi4_pointrelais_rechercheresponse.wsi4_pointrelais_rechercheresult)
    })
  })
}

/**
 *
 *
 * @export
 * @class MondialRelay Service
 * @extends {Model}
 */
module.exports = class MondialRelayService {
  constructor ({ config, logger }) {
    const requiredFields = ['store', 'privateKey', 'countryCode', 'locale']

    if (requiredFields.filter(field => Object.keys(config).includes(field)).length !== requiredFields.length) logger.error(new Error('please provide all required fields for MondialRelay configuration in nuxt.config.js'))

    this.config = config
  }

  /**
   * Get stores
   * @param {Object} params
   */
  async getStores ({ type, limit, locale, ...content }) {
    const limitStores = limit || 10
    const radius = this.config.radius || 10
    let xmlLocation = ''
    let hashLocation = ''

    if (type === 'geocode') {
      let latitude = Math.abs(content.lat)
      latitude = latitude < 10 ? `0${latitude.toFixed(7)}` : latitude.toFixed(7)

      let longitude = Math.abs(content.lng)
      longitude = longitude < 10 ? `0${longitude.toFixed(7)}` : longitude.toFixed(7)

      if (content.lat < 0) latitude = `-${latitude}`
      if (content.lng < 0) longitude = `-${longitude}`

      xmlLocation = `<Latitude>${latitude}</Latitude><Longitude>${longitude}</Longitude>`
      hashLocation = `${latitude}${longitude}`
    } else {
      // Need city and postcode because the api can return a code error 9 'Ville non reconnu ou non unique'
      xmlLocation = `<Ville>${content.city}</Ville>`
      xmlLocation = `<CP>${content.postcode}</CP>`
      hashLocation = `${content.city}${content.postcode}`
    }

    const string = `${this.config.store}${locale.toUpperCase() || this.config.locale}${hashLocation}${radius}${limitStores}${this.config.privateKey}`
    const hash = crypto.createHash('md5').update(string).digest('hex').toUpperCase()

    const data = `<?xml version="1.0" encoding="utf-8"?>
      <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
         <soap12:Body>
          <WSI4_PointRelais_Recherche xmlns="http://www.mondialrelay.fr/webservice/">
            <Enseigne>${this.config.store}</Enseigne>
            <Pays>${locale.toUpperCase() || this.config.locale}</Pays>
            ${xmlLocation}
            <RayonRecherche>${radius}</RayonRecherche>
            <NombreResultats>${limitStores}</NombreResultats>
            <Security>${hash}</Security>
          </WSI4_PointRelais_Recherche>
        </soap12:Body>
      </soap12:Envelope>`

    try {
      const response = await new Promise((resolve, reject) => {
        const req = https.request({
          protocol: 'https:',
          hostname: 'api.mondialrelay.com',
          path: '/Web_Services.asmx',
          method: 'POST',
          headers: {
            'Content-Type': 'application/soap+xml; charset=utf-8',
            'Content-Length': data.length
          }
        }, (res) => {
          let data = ''

          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            resolve(data)
          })
        }).on('error', reject)

        req.write(data)
        req.end()
      })

      try {
        const jsonResponse = await toJson(response)
        return mapResponse(jsonResponse, locale || this.config.locale)
      } catch (error) {
        return [`Error from Mondial Relay : ${error}`]
      }
    } catch (err) {
      return [err]
    }
  }
}

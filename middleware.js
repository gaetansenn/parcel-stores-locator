const nodeRes = require('node-res')
const nodeReq = require('node-req')

module.exports = ({ providers }) => async (req, res) => {
  if (req.method !== 'POST') {
    nodeRes.status(res, 400)
    nodeRes.end(res)

    return
  }

  const url = decodeURI(nodeReq.url(req))
  const provider = url.replace('/', '')

  if (!Object.keys(providers).includes(provider)) {
    nodeRes.status(res, 400)
    nodeRes.send(req, res, `Provider ${provider} not supported or activated`)

    return
  }

  // Handle body
  let body = ''

  req.on('data', function (data) {
    body += data
  })
  // Wait for body data
  await new Promise(function (resolve, reject) {
    req.on('end', resolve)
    req.on('error', reject)
  })
  // Parse body
  if (body) body = JSON.parse(body)
  else {
    nodeRes.status(res, 204)
    nodeRes.end(res)

    return
  }

  // Check body
  if (!body.type || !['geocode', 'address'].includes(body.type)) {
    nodeRes.status(res, 400)
    nodeRes.send(req, res, 'please provide search type \'geocode\' or \'address\'')
  }

  if (body.type === 'geocode' && (!body.lat || !body.long)) {
    nodeRes.status(res, 400)
    nodeRes.send(req, res, 'please provide lat and long')
  }

  if (body.type === 'address' && !body.address) {
    nodeRes.status(res, 400)
    nodeRes.send(req, res, 'please provide address')
  }

  // TODO: Inject limit as query
  const [error, response] = await providers[provider].getStores(body)

  if (error) {
    nodeRes.status(res, 502)
    nodeRes.send(req, res, error)
  } else nodeRes.send(req, res, response)
}

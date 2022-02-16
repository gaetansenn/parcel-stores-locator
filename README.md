## Table of Contents

- [Features](#features)
- [Usage](#usage)

> Module to Expose and draw on the map the locations of parcel retrieval from most shippers such as UPS, DHL, La Poste, Mondial Relay ...

## Requirements
Please use the version of node 13 if you want to support native i18n or include intl during node compilation

## Features

- Api plugin (SSR, Client side) to return locations according to provider (Ups and more soon)
- Maps components to display location (Gmap and more soon)
- List component to display location

## Usage

Set the `parcelStoresLocator` option in `nuxt.config`:

```js
export default {
  parcelStoresLocator {
    providers: {
      ups: {
        // Ups configuration
      },
      mondialrelay: {
        // Mondial Relay configuration
      }
    }
  }
}
```

**Note:** If using nuxt `2.10...2.13`, you will have to import components manually otherwise install and add `@nuxt/components` to `buildModules` inside `nuxt.config`.

`parcelStoresLocator` will automatically load provider according to configuration.

### Components

Parcel Stores locator inject vue components with `components:dirs` nuxt hook to display the stores inside a map.

#### Gmap

Please add `nuxt-gmaps` and set your configuration:

```js
export default {
  parcelStoresLocator {
    gmap: {
      location: {
        icon: 'data:image/png;base64,...' // Change default gps location icon
      },
       compass: {
        icon: 'data:image/png;base64,...' // Change default compass icon
      },
      pins: {
        selected: {
          icon: 'data:image/png;base64,...' // Please provide selected pin
        },
        unselected: {
          icon: 'data:image/png;base64,...' // Please provide unselected pin
        }
      },
      // TODO: Add more config
    }
  }
}
```

Then inside your page
```html
<parcel-stores-locator-gmap
  v-model="selected" // selected store
  :position="position"  // position of user (ex: GPS position)
  :locations="stores" // All locations returned by $parcelStoresLocator.getGeolocation()
  @select="select" // Select event from map
/>
```

##### Methods
You can access to component methods by using the ref argument.
For instance we would like to zoom map to locations after `display: none` removed


```html
<parcel-stores-locator-gmap
  ref="map"
/>
```

Then in your component

```js
methods: {
  openMap () {
    openMap () {
      this.opened = true
      this.$nextTick(this.$refs.map.zoomOnLocations)
    }
  }
}
```





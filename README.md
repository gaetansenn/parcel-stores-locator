## Table of Contents

- [Features](#features)
- [Usage](#usage)

> Module to Expose and draw on the map the locations of parcel retrieval from most shippers such as UPS, DHL, La Poste ...

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
      }
    }
  }
}
```

**Note:** If using nuxt `2.10...2.13`, you will have to import components manually otherwise install and add `@nuxt/components` to `buildModules` inside `nuxt.config`.

`parcelStoresLocator` will automatically load provider according to configuration.



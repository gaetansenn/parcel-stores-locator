<template>
  <div class="stores-map">
    <GMap
      ref="gMap"
      :cluster="$parcelStoresLocator.config.gmap.cluster"
      :options="{
        fullscreenControl: false,
        mapTypeControl: false
      }"
      :zoom="12"
      @init="init"
    >
      <GMapMarker
        v-for="location in newLocations"
        :key="location.id"
        :position="{ lat: location.lat, lng: location.lng }"
        :options="{ icon: location === newValue ? $parcelStoresLocator.config.gmap.pins.selected.icon : $parcelStoresLocator.config.gmap.pins.unselected.icon }"
        @click="select(location)"
      />
    </GMap>
    <div v-if="$parcelStoresLocator.config.gmap.compass" class="stores-map-location" @click="updateLocation">
      <img :src="$parcelStoresLocator.config.gmap.compass.icon">
    </div>
    <slot />
  </div>
</template>

<script>

export default {
  props: {
    /**
     * The current position to display
     */
    position: {
      type: Object,
      default: undefined
    },
    /**
     * The locations to display
     */
    locations: {
      type: Array,
      default: () => []
    },
    /* Select store */
    value: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      icons: {
        location: this.$parcelStoresLocator.config.gmap.location.icon || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyNpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQwIDc5LjE2MDQ1MSwgMjAxNy8wNS8wNi0wMTowODoyMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkI4NTZBODAzRkVFQTExRTlBQzhFRjk0MDU0MTFFNDZFIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkI4NTZBODA0RkVFQTExRTlBQzhFRjk0MDU0MTFFNDZFIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6Qjg1NkE4MDFGRUVBMTFFOUFDOEVGOTQwNTQxMUU0NkUiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6Qjg1NkE4MDJGRUVBMTFFOUFDOEVGOTQwNTQxMUU0NkUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4CrAfTAAABy1BMVEWoxOYAU7Wnw+Wmw+WpxeanxOb///8AUbSjweWpxOasxealwuWvxueqxOajwuirxueqyOywyOcgZr2nw+axyOexxufI0uwARK8ASLDX4e2sx+e+1e0ATbKyy+bV5PTy9Pbw8/YARa+sxOarxeavxebu8PLZ4Oi0x+ezy+mjw+mjwumtxea5x+e3x+fL0ev5+/tRhsv+/v/G2+9nltKryOv8/Pyyxuejwub29/nF2u8ASLH3+PnF1+vL2OinxerU4/Xu8/r9/v+1x+eqvePy9/uiweanxeupx+weZr0IVre80uyfvePR3/HI2e4jZr2zyOjU3+y0yunM2enN2um0zetPhssLVrazx+euxufs7/O4zOkAULS1zey1zemyy+i1zuzK1+e0zOq1xufu9fudvOLL1u+qxeanuOH2+vzl7vjl7vemtN6rvuTNz+qtx+i4z+rg6fbH1+q60uzQ3/EAS7HT3usASrGwyOhlltGjwueyyeesxufI1+qqxefMz+qwyOXH2O72+PzV4vOxyeWoueGjwuXQ3/K0zOyqx+vT4vTL3O/r7vK4zeqyy+kAS7Ksx+gSXrmms97G1+yuyOenwuTd6PStxucQXbn///+dE9P8AAAAmXRSTlP//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wDzXnAbAAABTklEQVR42jyQU5cDQRCFK6NgYnNjbbS2bdu2bdve+bnbPcmmHrrP/U6dqroXuHjllT5T4ymxuAD+7S86faWAUtiOvEl4UyOiAZdGpGxLwLNqEv6LTB3LxrApFyuZzt/rQj8hNyH4WIL7pLtLi1c/WjGiSgdwHyLEWr/WGIaZbFfJAEQPUHiJdkhJZkrd87ZXtdoHwHbBvQLNUy007liFg87u8k8JEIcwQgHoKpk6q0AgEL5k6CsAjoFAE/3vTL0QQYFhYzmMLw6gzpxZ5peHRks0QgMFKQoCXKG5TCeiRnXZkweIFYjZNADaQHralqGgpflbIgZ2CLh1dKf4YPg8v8Eyf+GWAMg7gPPWIkczUpX+JDrgDhFA3tmR9+0gvkAyEY54kEsy6ONTKpZj9zRN8yltJvI0Ka9Z3E2w+1m+ZPKO6VszSt482mnH8k+AAQA5aFh88bU4bAAAAABJRU5ErkJggg==',
        compass: this.$parcelStoresLocator.config.gmap.compass || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADSSURBVDiNldI9bgIxEIbhZ7fchibiIita2ijXiCjS0CPlIinokdLlEinyUyQSEhW3oKBAk2YdLYsTvJY+uZh5X9ljVxFhzKqqqsYtHnAjIoqCKVbYI7q8lIBzbHDsgSl3f0ETLLHNQCl71EOwxRqHf8CUVZpfg3u8FUApR0yT4GMEmLLpnVqLRzxjh1OBYP4ryAywwQwLvGbg7Vn/lSdcZATLMYLZAD5gMkbQDGayvugp+Im7nqAd1mvX13e3v0fE57BYIvjq9qdsteAKbSdpcvUflZp/JGh82OkAAAAASUVORK5CYII='
      },
      newLocations: this.locations,
      newValue: this.value,
      readySubscriptions: []
    }
  },
  watch: {
    position: 'onPositionChange',
    value: 'onValueChange',
    locations: 'onLocationsChange'
  },
  methods: {
    onReady (method) {
      if (this.ready) method()
      else this.readySubscriptions.push(method)
    },
    init (googleApi) {
      console.log('init methdo')
      // To prevent double initialization of map
      if (this.ready) return

      this.googleApi = googleApi
      // Avoid calling init method if component already destroyed
      if (!this.$refs.gMap || !this.$refs.gMap.map) return false

      // Avoid calling init method after async geoloc call
      if (!this.$refs.gMap) return false

      if (this.position && Object.keys(this.position).length > 0 && this.position.constructor === Object) {
        this.marker = new googleApi.maps.Marker({
          position: { lat: this.position.lat, lng: this.position.lng },
          map: this.$refs.gMap.map,
          options: {
            visible: true,
            icon: this.$parcelStoresLocator.config.gmap.location.icon
          }
        })
        this.$refs.gMap.map.panTo(this.position)
      } else this.zoomMarkers(this.newLocations)

      this.ready = true
      this.readySubscriptions.forEach(method => method())
    },
    onPositionChange (position) {
      this.onReady(() => {
        this.marker = new this.googleApi.maps.Marker({
          position,
          map: this.$refs.gMap.map,
          options: {
            visible: true,
            icon: this.$parcelStoresLocator.config.gmap.location.icon
          }
        })
        this.$refs.gMap.map.panTo(position)
      })
    },
    onLocationsChange (locations) {
      console.log('on location change')
      this.newLocations = locations
      this.$nextTick(() => {
        this.onReady(() => {
          this.$refs.gMap.initChildren()
          this.zoomMarkers(this.newLocations)
        })
      })
    },
    zoomMarkers (locations) {
      const bounds = new this.googleApi.maps.LatLngBounds()

      locations.forEach((location) => {
        bounds.extend(new this.googleApi.maps.LatLng(location.lat, location.lng))
      })

      this.$refs.gMap.map.fitBounds(bounds)
      this.$refs.gMap.map.panToBounds(bounds)
    },
    async updateLocation () {
      // We get the location of user
      const [error, location] = await this.$parcelStoresLocator.getGeolocation()

      if (error) return false

      const pos = { lat: location.lat, lng: location.lng }

      this.marker.position = pos
      this.$refs.gMap.map.panTo(pos)
    },
    onValueChange (newValue) {
      this.newValue = newValue

      // Center to selected position
      if (this.$refs.gMap.map.zoom !== 15) this.$refs.gMap.map.setZoom(15)
      this.$refs.gMap.map.panTo(newValue)
    },
    select (location) {
      this.$emit('input', location)
      this.$emit('select', location)
    }
  }
}
</script>

<style lang="scss">
.stores-map {
  @apply relative;

  .GMap {
    @apply h-full;
  }

  .GMap__Wrapper {
    @apply w-full h-full;
  }

  &-search {
    @apply absolute z-10 w-1/3;
    top: 10px;
    left: 10px;
  }

  &-location {
    @apply absolute flex items-center justify-center shadow-lg p-2 bg-white rounded-full cursor-pointer;
    bottom: 190px;
    right: 9px;

    &:hover {
      @apply shadow-xl;
    }
  }
}
</style>

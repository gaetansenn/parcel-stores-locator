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
      }

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

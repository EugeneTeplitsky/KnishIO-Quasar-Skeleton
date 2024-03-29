import useDltStore from 'src/stores/dlt'

export default {
  data () {
    return {
      dltStore: useDltStore(this.$pinia)
    }
  }
}

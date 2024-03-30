import useDltStore from 'src/stores/dlt'

export default function useHasDltStore () {
  const dltStore = useDltStore()

  return {
    dltStore
  }
}

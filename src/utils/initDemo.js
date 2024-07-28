import initProviders from './providers/initProviders.js'
import initCornerstoneDICOMImageLoader from './DICOMImageLoader/initCornerstoneDICOMImageLoader.js'

export default async function initDemo() {
  initProviders()
  initCornerstoneDICOMImageLoader()
}

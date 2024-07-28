import dicomParser from 'dicom-parser'
import * as cornerstone from '@cornerstonejs/core'
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader'

export function initCornerstone() {
  cornerstoneDICOMImageLoader.external.cornerstone = cornerstone
  cornerstoneDICOMImageLoader.external.dicomParser = dicomParser

  cornerstoneDICOMImageLoader.configure({
    useWebWorkers: true,
    decodeConfig: {
      convertFloatPixelDataToInt: false,
      use16BitDataType: cornerstone.getConfiguration().rendering.useNorm16Texture,
    },
  })

  const maxWebWorkers = navigator.hardwareConcurrency
    ? Math.min(navigator.hardwareConcurrency, 7)
    : 1

  cornerstoneDICOMImageLoader.webWorkerManager.initialize({
    maxWebWorkers,
    startWebWorkersOnDemand: true,
    taskConfiguration: {
      decodeTask: {
        initializeCodecsOnStartup: false,
        strict: false,
      },
    },
  })
}

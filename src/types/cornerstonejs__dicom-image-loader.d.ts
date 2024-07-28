/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@cornerstonejs/dicom-image-loader' {
  import { ImageLoader } from 'cornerstone-core'

  export const external: {
    cornerstone: any
    dicomParser: any
  }

  export const wadouri: {
    fileManager: {
      add: (file: File) => string
    }
  }

  export const webWorkerManager: {
    initialize: (config: { maxWebWorkers: number; startWebWorkersOnDemand: boolean }) => void
  }

  export function configure(options: { beforeSend: (xhr: XMLHttpRequest) => void }): void

  export function loadImage(imageId: string): Promise<ImageLoader.Image>
}

import { metaData } from '@cornerstonejs/core'
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader'

/**
 * 이미지 ID 목록의 메타데이터를 미리 메모리에 로드하는 함수
 * @param {Array} imageIdsToPrefetch - 미리 로드할 이미지 ID 목록
 **/
async function prefetchMetadataInformation(imageIdsToPrefetch) {
  for (let i = 0; i < imageIdsToPrefetch.length; i++) {
    await cornerstoneDICOMImageLoader.wadouri.loadImage(imageIdsToPrefetch[i]).promise
  }
}

/**
 * 이미지 ID에서 프레임 정보를 추출하는 함수
 * @param {String} imageId - 프레임 정보를 추출할 이미지 ID
 * @returns {Object} - 프레임 인덱스와 프레임이 제거된 이미지 ID를 포함한 객체
 **/
function getFrameInformation(imageId) {
  if (imageId.includes('wadors:')) {
    const frameIndex = imageId.indexOf('/frames/')
    const imageIdFrameless = frameIndex > 0 ? imageId.slice(0, frameIndex + 8) : imageId
    return {
      frameIndex,
      imageIdFrameless,
    }
  } else {
    const frameIndex = imageId.indexOf('&frame=')
    let imageIdFrameless = frameIndex > 0 ? imageId.slice(0, frameIndex + 7) : imageId
    if (!imageIdFrameless.includes('&frame=')) {
      imageIdFrameless = imageIdFrameless + '&frame='
    }
    return {
      frameIndex,
      imageIdFrameless,
    }
  }
}

/**
 * 이미지 ID 목록을 받아서 각 이미지 ID가 프레임을 나타내는지 확인하고,
 * 멀티프레임 DICOM 이미지의 경우 각 프레임에 대한 새로운 이미지 ID 목록을 반환하는 함수
 * 멀티프레임 이미지를 나타내는 각 이미지 ID에 대해 n개의 프레임에 대한 새로운 이미지 ID를 생성하여 반환
 * 멀티프레임 이미지가 아닌 경우 해당 이미지 ID를 그대로 새로운 목록에 복사
 * @param {Array} imageIds - 이미지 ID 목록
 * @returns {Array} - 각 이미지 ID가 프레임을 나타내는 새로운 이미지 ID 목록
 **/
function convertMultiframeImageIds(imageIds) {
  const newImageIds = []
  imageIds.forEach((imageId) => {
    const { imageIdFrameless } = getFrameInformation(imageId)
    const instanceMetaData = metaData.get('multiframeModule', imageId)
    if (
      instanceMetaData &&
      instanceMetaData.NumberOfFrames &&
      instanceMetaData.NumberOfFrames > 1
    ) {
      const NumberOfFrames = instanceMetaData.NumberOfFrames
      for (let i = 0; i < NumberOfFrames; i++) {
        const newImageId = imageIdFrameless + (i + 1)
        newImageIds.push(newImageId)
      }
    } else {
      newImageIds.push(imageId)
    }
  })
  return newImageIds
}

export { convertMultiframeImageIds, prefetchMetadataInformation }

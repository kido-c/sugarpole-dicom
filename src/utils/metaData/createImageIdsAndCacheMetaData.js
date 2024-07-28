import { api } from 'dicomweb-client'
import dcmjs from 'dcmjs'
import { calculateSUVScalingFactors } from '@cornerstonejs/calculate-suv'
import { getPTImageIdInstanceMetadata } from './getPTImageIdInstanceMetadata.ts'
import { utilities } from '@cornerstonejs/core'
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader'

import ptScalingMetaDataProvider from './ptScalingMetaDataProvider.js'
import getPixelSpacingInformation from './getPixelSpacingInformation.js'
import { convertMultiframeImageIds } from './convertMultiframeImageIds.js'
import removeInvalidTags from './removeInvalidTags.js'

const { DicomMetaDictionary } = dcmjs.data
const { calibratedPixelSpacingMetadataProvider } = utilities

/**
 * dicomweb-client를 사용하여 스터디의 메타데이터를 가져오고, 이를 cornerstone에 캐시한 후,
 * 프레임에 대한 imageIds 목록을 반환합니다.
 *
 * 앱 구성(config)을 사용하여 가져올 스터디와
 * 가져올 dicom-web 서버를 선택합니다.
 *
 * @param {Object} options - 함수 매개변수
 * @param {string} options.StudyInstanceUID - 스터디 인스턴스 UID
 * @param {string} options.SeriesInstanceUID - 시리즈 인스턴스 UID
 * @param {string} [options.SOPInstanceUID=null] - SOP 인스턴스 UID (선택 사항)
 * @param {string} options.wadoRsRoot - wado-RS 서버의 루트 URL
 * @param {object} [options.client=null] - DICOMwebClient 인스턴스 (선택 사항)
 * @param {boolean} [options.convertMultiframe=true] - 멀티프레임 변환 여부 (선택 사항)
 * @returns {Promise<string[]>} - 스터디 내 인스턴스에 대한 imageIds 배열
 */
export default async function createImageIdsAndCacheMetaData({
  StudyInstanceUID,
  SeriesInstanceUID,
  SOPInstanceUID = null,
  wadoRsRoot,
  client = null,
  convertMultiframe = true,
}) {
  const SOP_INSTANCE_UID = '00080018'
  const SERIES_INSTANCE_UID = '0020000E'
  const MODALITY = '00080060'

  const studySearchOptions = {
    studyInstanceUID: StudyInstanceUID,
    seriesInstanceUID: SeriesInstanceUID,
  }

  // DICOMwebClient 인스턴스 생성
  client = client || new api.DICOMwebClient({ url: wadoRsRoot })
  let instances = await client.retrieveSeriesMetadata(studySearchOptions)

  // SOP 인스턴스가 제공된 경우 해당 인스턴스만 포함하도록 필터링
  if (SOPInstanceUID) {
    instances = instances.filter((instance) => {
      return instance[SOP_INSTANCE_UID].Value[0] === SOPInstanceUID
    })
  }

  const modality = instances[0][MODALITY].Value[0]
  let imageIds = instances.map((instanceMetaData) => {
    const SeriesInstanceUID = instanceMetaData[SERIES_INSTANCE_UID].Value[0]
    const SOPInstanceUIDToUse = SOPInstanceUID || instanceMetaData[SOP_INSTANCE_UID].Value[0]

    const prefix = 'wadors:'

    const imageId =
      prefix +
      wadoRsRoot +
      '/studies/' +
      StudyInstanceUID.trim() +
      '/series/' +
      SeriesInstanceUID.trim() +
      '/instances/' +
      SOPInstanceUIDToUse.trim() +
      '/frames/1'

    cornerstoneDICOMImageLoader.wadors.metaDataManager.add(imageId, instanceMetaData)
    return imageId
  })

  // 이미지 ID가 멀티프레임 정보를 나타내는 경우, 각 프레임에 대한 새로운 이미지 ID 목록을 생성
  // 멀티프레임 데이터가 없으면 주어진 목록을 그대로 반환
  if (convertMultiframe) {
    imageIds = convertMultiframeImageIds(imageIds)
  }

  imageIds.forEach((imageId) => {
    let instanceMetaData = cornerstoneDICOMImageLoader.wadors.metaDataManager.get(imageId)

    // JSON.parse(JSON.stringify(...)) 대신 사용 (8배 더 빠름)
    instanceMetaData = removeInvalidTags(instanceMetaData)

    if (instanceMetaData) {
      // 보정된 픽셀 간격 추가
      const metadata = DicomMetaDictionary.naturalizeDataset(instanceMetaData)
      const pixelSpacing = getPixelSpacingInformation(metadata)

      if (pixelSpacing) {
        calibratedPixelSpacingMetadataProvider.add(imageId, {
          rowPixelSpacing: parseFloat(pixelSpacing[0]),
          columnPixelSpacing: parseFloat(pixelSpacing[1]),
        })
      }
    }
  })

  // PET가 아닌 데이터는 추가하지 않음
  // 참고: 99%의 스캐너에서 슬라이스 간 SUV 계산 일관성 유지
  if (modality === 'PT') {
    const InstanceMetadataArray = []
    imageIds.forEach((imageId) => {
      const instanceMetadata = getPTImageIdInstanceMetadata(imageId)

      // TODO: 임시 수정 - static-wado가 문자열을 생성하고 있어 배열이 아닌 값이 나오는 문제 해결
      // (또는 dcmjs가 이를 올바르게 파싱하지 못하고 있음)
      // 'DECY\\ATTN\\SCAT\\DTIM\\RAN\\RADL\\DCAL\\SLSENS\\NORM'처럼 나타남
      // 그러나 calculate-suv는 ['DECY', 'ATTN', ...]를 기대함
      if (typeof instanceMetadata.CorrectedImage === 'string') {
        instanceMetadata.CorrectedImage = instanceMetadata.CorrectedImage.split('\\')
      }

      if (instanceMetadata) {
        InstanceMetadataArray.push(instanceMetadata)
      }
    })
    if (InstanceMetadataArray.length) {
      try {
        const suvScalingFactors = calculateSUVScalingFactors(InstanceMetadataArray)
        InstanceMetadataArray.forEach((instanceMetadata, index) => {
          ptScalingMetaDataProvider.addInstance(imageIds[index], suvScalingFactors[index])
        })
      } catch (error) {
        console.log(error)
      }
    }
  }

  return imageIds
}

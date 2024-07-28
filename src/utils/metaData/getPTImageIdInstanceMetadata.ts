import { metaData } from '@cornerstonejs/core'
import type { InstanceMetadata } from '@cornerstonejs/calculate-suv'

/**
 * 주어진 이미지 ID에 대한 PET 메타데이터를 가져와서 InstanceMetadata 객체로 반환하는 함수
 *
 * @param {string} imageId - 메타데이터를 가져올 이미지 ID
 * @returns {InstanceMetadata} - 이미지 ID에 대한 InstanceMetadata 객체
 */
export default function getPTImageIdInstanceMetadata(imageId: string): InstanceMetadata {
  // 메타데이터 모듈을 가져옵니다.
  const petSequenceModule = metaData.get('petIsotopeModule', imageId)
  const generalSeriesModule = metaData.get('generalSeriesModule', imageId)
  const patientStudyModule = metaData.get('patientStudyModule', imageId)
  const ptSeriesModule = metaData.get('petSeriesModule', imageId)
  const ptImageModule = metaData.get('petImageModule', imageId)

  // petSequenceModule이 없으면 에러를 발생시킵니다.
  if (!petSequenceModule) {
    throw new Error('petSequenceModule metadata is required')
  }

  // 방사성 의약품 정보를 가져옵니다.
  const radiopharmaceuticalInfo = petSequenceModule.radiopharmaceuticalInfo

  // 필요한 메타데이터를 모듈에서 가져옵니다.
  const { seriesDate, seriesTime, acquisitionDate, acquisitionTime } = generalSeriesModule
  const { patientWeight } = patientStudyModule
  const { correctedImage, units, decayCorrection } = ptSeriesModule

  // 필수 메타데이터가 없으면 에러를 발생시킵니다.
  if (
    seriesDate === undefined ||
    seriesTime === undefined ||
    patientWeight === undefined ||
    acquisitionDate === undefined ||
    acquisitionTime === undefined ||
    correctedImage === undefined ||
    units === undefined ||
    decayCorrection === undefined ||
    radiopharmaceuticalInfo.radionuclideTotalDose === undefined ||
    radiopharmaceuticalInfo.radionuclideHalfLife === undefined ||
    (radiopharmaceuticalInfo.radiopharmaceuticalStartDateTime === undefined &&
      seriesDate === undefined &&
      radiopharmaceuticalInfo.radiopharmaceuticalStartTime === undefined)
  ) {
    throw new Error('required metadata are missing')
  }

  // InstanceMetadata 객체를 생성합니다.
  const instanceMetadata: InstanceMetadata = {
    CorrectedImage: correctedImage,
    Units: units,
    RadionuclideHalfLife: radiopharmaceuticalInfo.radionuclideHalfLife,
    RadionuclideTotalDose: radiopharmaceuticalInfo.radionuclideTotalDose,
    DecayCorrection: decayCorrection,
    PatientWeight: patientWeight,
    SeriesDate: seriesDate,
    SeriesTime: seriesTime,
    AcquisitionDate: acquisitionDate,
    AcquisitionTime: acquisitionTime,
  }

  // RadiopharmaceuticalStartDateTime을 문자열로 변환하여 추가합니다.
  if (
    radiopharmaceuticalInfo.radiopharmaceuticalStartDateTime &&
    typeof radiopharmaceuticalInfo.radiopharmaceuticalStartDateTime === 'string'
  ) {
    instanceMetadata.RadiopharmaceuticalStartDateTime =
      radiopharmaceuticalInfo.radiopharmaceuticalStartDateTime
  } else if (
    radiopharmaceuticalInfo.radiopharmaceuticalStartDateTime &&
    typeof radiopharmaceuticalInfo.radiopharmaceuticalStartDateTime !== 'string'
  ) {
    const dateString = convertInterfaceDateToString(
      radiopharmaceuticalInfo.radiopharmaceuticalStartDateTime,
    )
    instanceMetadata.RadiopharmaceuticalStartDateTime = dateString
  }

  // AcquisitionDate를 문자열로 변환하여 추가합니다.
  if (instanceMetadata.AcquisitionDate && typeof instanceMetadata.AcquisitionDate !== 'string') {
    const dateString = convertInterfaceDateToString(instanceMetadata.AcquisitionDate)
    instanceMetadata.AcquisitionDate = dateString
  }

  // SeriesDate를 문자열로 변환하여 추가합니다.
  if (instanceMetadata.SeriesDate && typeof instanceMetadata.SeriesDate !== 'string') {
    const dateString = convertInterfaceDateToString(instanceMetadata.SeriesDate)
    instanceMetadata.SeriesDate = dateString
  }

  // RadiopharmaceuticalStartTime을 문자열로 변환하여 추가합니다.
  if (
    radiopharmaceuticalInfo.radiopharmaceuticalStartTime &&
    typeof radiopharmaceuticalInfo.radiopharmaceuticalStartTime === 'string'
  ) {
    instanceMetadata.RadiopharmaceuticalStartTime =
      radiopharmaceuticalInfo.radiopharmaceuticalStartTime
  } else if (
    radiopharmaceuticalInfo.radiopharmaceuticalStartTime &&
    typeof radiopharmaceuticalInfo.radiopharmaceuticalStartTime !== 'string'
  ) {
    const timeString = convertInterfaceTimeToString(
      radiopharmaceuticalInfo.radiopharmaceuticalStartTime,
    )
    instanceMetadata.RadiopharmaceuticalStartTime = timeString
  }

  // AcquisitionTime을 문자열로 변환하여 추가합니다.
  if (instanceMetadata.AcquisitionTime && typeof instanceMetadata.AcquisitionTime !== 'string') {
    const timeString = convertInterfaceTimeToString(instanceMetadata.AcquisitionTime)
    instanceMetadata.AcquisitionTime = timeString
  }

  // SeriesTime을 문자열로 변환하여 추가합니다.
  if (instanceMetadata.SeriesTime && typeof instanceMetadata.SeriesTime !== 'string') {
    const timeString = convertInterfaceTimeToString(instanceMetadata.SeriesTime)
    instanceMetadata.SeriesTime = timeString
  }

  // 프레임 참조 시간을 추가합니다.
  if (ptImageModule.frameReferenceTime) {
    instanceMetadata.FrameReferenceTime = ptImageModule.frameReferenceTime
  }

  // 실제 프레임 지속 시간을 추가합니다.
  if (ptImageModule.actualFrameDuration) {
    instanceMetadata.ActualFrameDuration = ptImageModule.actualFrameDuration
  }

  // 환자의 성별을 추가합니다.
  if (patientStudyModule.patientSex) {
    instanceMetadata.PatientSex = patientStudyModule.patientSex
  }

  // 환자의 신장을 추가합니다.
  if (patientStudyModule.patientSize) {
    instanceMetadata.PatientSize = patientStudyModule.patientSize
  }

  return instanceMetadata
}

interface Time {
  hours?: number
  minutes?: number
  seconds?: number
  fractionalSeconds?: number
}

/**
 * Time 객체를 문자열로 변환하는 함수
 *
 * @param {Time} time - 변환할 Time 객체
 * @returns {string} - 변환된 시간 문자열
 */
function convertInterfaceTimeToString(time: Time): string {
  const hours = `${time.hours || '00'}`.padStart(2, '0')
  const minutes = `${time.minutes || '00'}`.padStart(2, '0')
  const seconds = `${time.seconds || '00'}`.padStart(2, '0')

  const fractionalSeconds = `${time.fractionalSeconds || '000000'}`.padEnd(6, '0')

  const timeString = `${hours}${minutes}${seconds}.${fractionalSeconds}`
  return timeString
}

interface Date {
  year: number
  month: number
  day: number
}

/**
 * Date 객체를 문자열로 변환하는 함수
 *
 * @param {Date} date - 변환할 Date 객체
 * @returns {string} - 변환된 날짜 문자열
 */
function convertInterfaceDateToString(date: Date): string {
  const month = `${date.month}`.padStart(2, '0')
  const day = `${date.day}`.padStart(2, '0')
  const dateString = `${date.year}${month}${day}`
  return dateString
}

export { getPTImageIdInstanceMetadata }

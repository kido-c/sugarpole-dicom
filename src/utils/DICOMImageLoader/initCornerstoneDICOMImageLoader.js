import dicomParser from 'dicom-parser'
import * as cornerstone from '@cornerstonejs/core'
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader'

// cornerstone의 렌더링 설정을 가져옵니다.
const { preferSizeOverAccuracy, useNorm16Texture } = cornerstone.getConfiguration().rendering

/**
 * cornerstoneDICOMImageLoader를 초기화하는 함수
 */
export default function initCornerstoneDICOMImageLoader() {
  // 외부 라이브러리 설정
  cornerstoneDICOMImageLoader.external.cornerstone = cornerstone
  cornerstoneDICOMImageLoader.external.dicomParser = dicomParser

  // cornerstoneDICOMImageLoader의 구성 설정
  cornerstoneDICOMImageLoader.configure({
    useWebWorkers: true, // 웹 워커 사용 여부 설정
    decodeConfig: {
      convertFloatPixelDataToInt: false, // 부동 소수점 픽셀 데이터를 정수로 변환하지 않음
      use16BitDataType: preferSizeOverAccuracy || useNorm16Texture, // 16비트 데이터 유형 사용 여부 설정
    },
  })

  let maxWebWorkers = 1

  // 하드웨어 스레드 수에 따라 최대 웹 워커 수 설정
  if (navigator.hardwareConcurrency) {
    maxWebWorkers = Math.min(navigator.hardwareConcurrency, 7)
  }

  // 웹 워커 관리자 구성 설정
  const config = {
    maxWebWorkers, // 최대 웹 워커 수
    startWebWorkersOnDemand: false, // 필요할 때만 웹 워커 시작
    taskConfiguration: {
      decodeTask: {
        initializeCodecsOnStartup: false, // 초기화 시 코덱 로드하지 않음
        strict: false, // 엄격 모드 비활성화
      },
    },
  }

  // 웹 워커 관리자 초기화
  cornerstoneDICOMImageLoader.webWorkerManager.initialize(config)
}

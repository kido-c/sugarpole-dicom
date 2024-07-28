// See https://github.com/OHIF/Viewers/blob/94a9067fe3d291d30e25a1bda5913511388edea2/platform/core/src/utils/metadataProvider/getPixelSpacingInformation.js

export default function getPixelSpacingInformation(instance) {
  // See http://gdcm.sourceforge.net/wiki/index.php/Imager_Pixel_Spacing

  // TODO: Add Ultrasound region spacing
  // TODO: Add manual calibration

  // TODO: Use ENUMS from dcmjs
  const projectionRadiographSOPClassUIDs = [
    '1.2.840.10008.5.1.4.1.1.1', // CR Image Storage
    '1.2.840.10008.5.1.4.1.1.1.1', // Digital X-Ray Image Storage – for Presentation
    '1.2.840.10008.5.1.4.1.1.1.1.1', // Digital X-Ray Image Storage – for Processing
    '1.2.840.10008.5.1.4.1.1.1.2', // Digital Mammography X-Ray Image Storage – for Presentation
    '1.2.840.10008.5.1.4.1.1.1.2.1', // Digital Mammography X-Ray Image Storage – for Processing
    '1.2.840.10008.5.1.4.1.1.1.3', // Digital Intra – oral X-Ray Image Storage – for Presentation
    '1.2.840.10008.5.1.4.1.1.1.3.1', // Digital Intra – oral X-Ray Image Storage – for Processing
    '1.2.840.10008.5.1.4.1.1.12.1', // X-Ray Angiographic Image Storage
    '1.2.840.10008.5.1.4.1.1.12.1.1', // Enhanced XA Image Storage
    '1.2.840.10008.5.1.4.1.1.12.2', // X-Ray Radiofluoroscopic Image Storage
    '1.2.840.10008.5.1.4.1.1.12.2.1', // Enhanced XRF Image Storage
    '1.2.840.10008.5.1.4.1.1.12.3', // X-Ray Angiographic Bi-plane Image Storage (Retired)
  ]

  const {
    PixelSpacing,
    ImagerPixelSpacing,
    SOPClassUID,
    PixelSpacingCalibrationType,
    PixelSpacingCalibrationDescription,
    EstimatedRadiographicMagnificationFactor,
    SequenceOfUltrasoundRegions,
  } = instance

  const isProjection = projectionRadiographSOPClassUIDs.includes(SOPClassUID)

  const TYPES = {
    NOT_APPLICABLE: 'NOT_APPLICABLE',
    UNKNOWN: 'UNKNOWN',
    CALIBRATED: 'CALIBRATED',
    DETECTOR: 'DETECTOR',
  }

  if (!isProjection) {
    return PixelSpacing
  }

  if (isProjection && !ImagerPixelSpacing) {
    // 프로젝션 방사선 사진에서 Pixel Spacing만 존재하는 경우,
    // PixelSpacing을 사용하지만 의미가 불분명함을 사용자에게 알려야 함
    return {
      PixelSpacing,
      type: TYPES.UNKNOWN,
      isProjection,
    }
  } else if (PixelSpacing && ImagerPixelSpacing && PixelSpacing === ImagerPixelSpacing) {
    // Imager Pixel Spacing과 Pixel Spacing이 모두 존재하고 값이 동일한 경우,
    // 측정값이 감지기 평면에서 이루어진 것임을 사용자에게 알려야 함
    return {
      PixelSpacing,
      type: TYPES.DETECTOR,
      isProjection,
    }
  } else if (PixelSpacing && ImagerPixelSpacing && PixelSpacing !== ImagerPixelSpacing) {
    // Imager Pixel Spacing과 Pixel Spacing이 모두 존재하고 값이 다른 경우,
    // 이 값들이 "보정된" 것임을 사용자에게 알려야 함
    return {
      PixelSpacing,
      type: TYPES.CALIBRATED,
      isProjection,
      PixelSpacingCalibrationType,
      PixelSpacingCalibrationDescription,
    }
  } else if (!PixelSpacing && ImagerPixelSpacing) {
    let CorrectedImagerPixelSpacing = ImagerPixelSpacing
    if (EstimatedRadiographicMagnificationFactor) {
      // IHE Mammo 프로파일 준수 디스플레이에서 Imager Pixel Spacing 값은
      // Estimated Radiographic Magnification Factor로 보정되어야 하며, 사용자에게 이를 알려야 함
      CorrectedImagerPixelSpacing = ImagerPixelSpacing.map(
        (pixelSpacing) => pixelSpacing / EstimatedRadiographicMagnificationFactor,
      )
    } else {
      console.warn(
        'EstimatedRadiographicMagnificationFactor가 존재하지 않습니다. ImagerPixelSpacing을 보정할 수 없습니다.',
      )
    }

    return {
      PixelSpacing: CorrectedImagerPixelSpacing,
      isProjection,
    }
  } else if (SequenceOfUltrasoundRegions && typeof SequenceOfUltrasoundRegions === 'object') {
    const { PhysicalDeltaX, PhysicalDeltaY } = SequenceOfUltrasoundRegions
    const USPixelSpacing = [PhysicalDeltaX * 10, PhysicalDeltaY * 10]

    return {
      PixelSpacing: USPixelSpacing,
    }
  } else if (
    SequenceOfUltrasoundRegions &&
    Array.isArray(SequenceOfUltrasoundRegions) &&
    SequenceOfUltrasoundRegions.length > 1
  ) {
    console.warn(
      'Sequence of Ultrasound Regions에 여러 항목이 있습니다. 이 기능은 아직 구현되지 않았으며, 모든 측정값은 픽셀 단위로 표시됩니다.',
    )
  } else if (isProjection === false && !ImagerPixelSpacing) {
    // Pixel Spacing만 존재하고, 프로젝션 방사선 사진이 아닌 경우,
    // 여기서 멈출 수 있습니다
    return {
      PixelSpacing,
      type: TYPES.NOT_APPLICABLE,
      isProjection,
    }
  }

  console.warn(
    'PixelSpacing과 ImagerPixelSpacing의 조합을 알 수 없습니다. 간격을 결정할 수 없습니다.',
  )
}

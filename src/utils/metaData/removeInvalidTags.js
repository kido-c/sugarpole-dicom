/**
 * 메타데이터에서 유효하지 않은 태그를 제거하고 새로운 객체를 반환합니다.
 *
 * 현재는 `null` 또는 `undefined` 값을 가진 태그만 제거하고 있으며,
 * 이는 `naturalizeDataset(...)` 호출 시 오류를 발생시키기 때문에 우리의 주요 목표입니다.
 *
 * 정규식을 사용하여 태그 ID를 검증하는 것은 성능을 약 50% 저하시킵니다.
 * 모든 문자를 순회하는 방법(split+every+Set 또는 단순 FOR+Set)은 실행 시간을 두 배로 증가시킵니다.
 * 현재 평균적으로 1,000개의 이미지에서 +12ms의 시간이 소요되며, 이는 머신에 따라 달라질 수 있습니다.
 *
 * @param {Object} srcMetadata - 원본 메타데이터
 * @returns {Object} - 유효하지 않은 태그가 제거된 새로운 메타데이터 객체
 */
function removeInvalidTags(srcMetadata) {
  // Object.create(null)을 사용하면 약 9% 더 빠릅니다.
  const dstMetadata = Object.create(null)
  const tagIds = Object.keys(srcMetadata)
  let tagValue

  tagIds.forEach((tagId) => {
    tagValue = srcMetadata[tagId]

    if (tagValue !== undefined && tagValue !== null) {
      dstMetadata[tagId] = tagValue
    }
  })

  return dstMetadata
}

export { removeInvalidTags as default, removeInvalidTags }

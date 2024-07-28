import { Enums, init, RenderingEngine, Types } from '@cornerstonejs/core'
import createImageIdsAndCacheMetaData from './metaData/createImageIdsAndCacheMetaData'
import initDemo from './initDemo'
import { renderingEngineId, viewportId } from '../constants/render'

const { ViewportType } = Enums

/**
 * Cornerstone을 설정하는 함수
 *
 */
export async function renderDICOM({
  renderContainer,
}: {
  renderContainer: React.RefObject<HTMLDivElement>
}) {
  // Cornerstone을 초기화합니다.
  await init()
  // provider, imageLoader 초기화
  await initDemo()

  if (!renderContainer.current) return

  // Cornerstone imageIds를 가져와 RAM에 메타데이터를 캐시합니다.
  // ! 필요시 정적 데이터가 아닌 동적 데이터를 가져올 수 있습니다.
  const imageIds = await createImageIdsAndCacheMetaData({
    StudyInstanceUID: '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
    SeriesInstanceUID: '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
    wadoRsRoot: 'https://d3t6nz73ql33tx.cloudfront.net/dicomweb',
  })

  // 렌더링 엔진 인스턴스를 생성합니다.
  const renderingEngine = new RenderingEngine(`${renderingEngineId}-${renderContainer.current.id}`)

  // 스택 뷰포트를 생성합니다.
  const viewportInput = {
    viewportId: `${viewportId}-${renderContainer.current.id}`,
    type: ViewportType.STACK,
    element: renderContainer.current,
  }

  // 렌더링 엔진에 요소를 활성화합니다.
  renderingEngine.enableElement(viewportInput)

  // 생성된 스택 뷰포트를 가져옵니다.
  const viewport = renderingEngine.getViewport(
    `${viewportId}-${renderContainer.current.id}`,
  ) as Types.IStackViewport

  // 몇 가지 이미지를 포함하는 스택을 정의합니다.
  const stack = [imageIds[0], imageIds[1], imageIds[2]]

  // 뷰포트에 스택을 설정합니다.
  await viewport.setStack(stack)

  // 이미지를 렌더링합니다.
  viewport.render()
}

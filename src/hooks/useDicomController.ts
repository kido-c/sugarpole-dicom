import { getRenderingEngine, Types } from '@cornerstonejs/core'
import { useState } from 'react'

export type ControllerActionType =
  | 'NEXT_IMG'
  | 'PREV_IMG'
  | 'FLIP_H'
  | 'FLIP_V'
  | 'ROTATE_DELTA_30'
  | 'ZOOM'
  | 'INVERT'
  | 'APPLY_COLORMAP'
  | 'RESET_VIEWPORT'

interface ControllerAction {
  type: ControllerActionType
}

interface Props {
  currentViewport: string
  renderingEngineId: string
  viewportId: string
}

export default function useDicomController({
  currentViewport,
  renderingEngineId,
  viewportId,
}: Props) {
  const [rotation, setRotation] = useState(0)
  const [flipHorizontal, setFlipHorizontal] = useState(false)
  const [flipVertical, setFlipVertical] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)

  const handleDicomController = (action: ControllerAction) => {
    const renderingEngine = getRenderingEngine(`${renderingEngineId}-${currentViewport}`)

    if (!renderingEngine) return
    const viewport = renderingEngine.getViewport(
      `${viewportId}-${currentViewport}`,
    ) as Types.IStackViewport

    switch (action.type) {
      case 'NEXT_IMG':
        {
          const nextIndex = Math.min(
            viewport.getCurrentImageIdIndex() + 1,
            viewport.getImageIds().length - 1,
          )
          viewport.setImageIdIndex(nextIndex)
        }
        break
      case 'PREV_IMG':
        {
          const prevIndex = Math.max(viewport.getCurrentImageIdIndex() - 1, 0)
          viewport.setImageIdIndex(prevIndex)
          break
        }
        break
      case 'FLIP_H':
        setFlipHorizontal(!flipHorizontal)
        viewport.setCamera({ flipHorizontal: !flipHorizontal })
        break
      case 'FLIP_V':
        setFlipVertical(!flipVertical)
        viewport.setCamera({ flipVertical: !flipVertical })
        break
      case 'ROTATE_DELTA_30':
        setRotation(rotation + 30)
        viewport.setProperties({ rotation: rotation + 30 })
        break
      case 'ZOOM':
        viewport.setZoom(zoomLevel + 0.1)
        setZoomLevel(zoomLevel + 0.1)
        break
      case 'INVERT':
        viewport.setProperties({ invert: !viewport.getProperties().invert })
        break
      case 'APPLY_COLORMAP':
        viewport.setProperties({ colormap: { name: 'hsv' } })
        break
      case 'RESET_VIEWPORT':
        viewport.resetCamera()
        viewport.resetProperties()
        setZoomLevel(1)
        setRotation(0)
        setFlipHorizontal(false)
        setFlipVertical(false)
        break
      default:
        break
    }

    viewport.render()
  }

  return { handleDicomController }
}

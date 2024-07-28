import useDicomController, { ControllerActionType } from '../hooks/useDicomController'
import { renderingEngineId, viewportId } from '../constants/render'

export default function Header({ currentViewport }: { currentViewport: string }) {
  const { handleDicomController } = useDicomController({
    currentViewport,
    renderingEngineId,
    viewportId,
  })

  const handleHeaderClick = (type: ControllerActionType) => {
    handleDicomController({ type: type })
  }

  return (
    <div className='w-full h-[116px] flex justify-between items-center p-[34px]  border-b-2 border-[#0F62FE]'>
      <h1 className='flex justify-center items-center'>Dicom Viewer(with Cornerstone.js)</h1>
      <div className='flex justify-between w-[649px] '>
        <button onClick={() => handleHeaderClick('ZOOM')}>Zoom</button>
        <button onClick={() => handleHeaderClick('FLIP_H')}>Flip H</button>
        <button onClick={() => handleHeaderClick('FLIP_V')}>Filp V</button>
        <button onClick={() => handleHeaderClick('ROTATE_DELTA_30')}>Rotate Delta 30</button>
        <button onClick={() => handleHeaderClick('INVERT')}>Invert</button>
        <button onClick={() => handleHeaderClick('APPLY_COLORMAP')}>Apply Colormap</button>
        <button onClick={() => handleHeaderClick('RESET_VIEWPORT')}>Reset</button>
      </div>
      <div className='flex gap-6'>
        <button
          className='w-[174px] h-[48px] flex justify-center items-center py-4 px-7 bg-[#0F62FE]'
          onClick={() => handleHeaderClick('PREV_IMG')}
        >
          Previous Image
        </button>
        <button
          className='w-[174px] h-[48px] flex justify-center items-center py-4 px-7 bg-[#0F62FE]'
          onClick={() => handleHeaderClick('NEXT_IMG')}
        >
          Next Image
        </button>
      </div>
    </div>
  )
}

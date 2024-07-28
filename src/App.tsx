/* eslint-disable no-case-declarations */

import Header from './components/Header'
import { useEffect, useRef, useState } from 'react'
import { renderDICOM } from './utils/renderDICOM'

export default function App() {
  const [currentViewport, setCurrentViewport] = useState('left')
  const leftView = useRef(null)
  const rightView = useRef(null)

  useEffect(() => {
    renderDICOM({ renderContainer: leftView })
    renderDICOM({ renderContainer: rightView })
  }, [])

  return (
    <div>
      <Header currentViewport={currentViewport} />
      <section className='w-[1442px] flex h-[903px]'>
        <div
          id='left'
          ref={leftView}
          className={`w-[720px] relative border-r-2 border-r-[#0F62FE]`}
          onClick={() => setCurrentViewport('left')}
        >
          {currentViewport === 'left' && (
            <span className='absolute text-white top-3 left-4 z-20'>Target View</span>
          )}
        </div>
        <div
          id='right'
          ref={rightView}
          className={`w-[720px] relative`}
          onClick={() => setCurrentViewport('right')}
        >
          {currentViewport === 'right' && (
            <span className='absolute text-white top-3 left-4 z-20'>Target View</span>
          )}
        </div>
      </section>
    </div>
  )
}

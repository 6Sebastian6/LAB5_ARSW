import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import BlueprintCanvas from '../src/components/BlueprintCanvas.jsx'

describe('BlueprintCanvas', () => {
  it('renderiza un canvas y llama getContext', () => {
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
    const { container } = render(
      <BlueprintCanvas
        points={[
          { x: 10, y: 10 },
          { x: 50, y: 60 },
        ]}
      />,
    )
    expect(container.querySelector('canvas')).toBeInTheDocument()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('tiene identificador propio y dimensiones 520x360 por defecto', () => {
    const { container } = render(<BlueprintCanvas />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toHaveAttribute('id', 'blueprint-canvas')
    expect(canvas).toHaveAttribute('width', '520')
    expect(canvas).toHaveAttribute('height', '360')
  })

  it('dibuja los segmentos consecutivos y marca cada punto', () => {
    const ctx = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
    }
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
    const points = [
      { x: 10, y: 10 },
      { x: 50, y: 60 },
      { x: 90, y: 20 },
    ]

    render(<BlueprintCanvas points={points} />)

    expect(ctx.moveTo).toHaveBeenCalledWith(10, 10)
    expect(ctx.lineTo).toHaveBeenCalledWith(50, 60)
    expect(ctx.lineTo).toHaveBeenCalledWith(90, 20)
    // un circulo por punto
    expect(ctx.arc).toHaveBeenCalledTimes(3)
    expect(ctx.arc).toHaveBeenCalledWith(90, 20, 4, 0, Math.PI * 2)
    spy.mockRestore()
  })
})

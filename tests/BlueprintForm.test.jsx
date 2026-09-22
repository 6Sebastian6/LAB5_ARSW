import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BlueprintForm from '../src/components/BlueprintForm.jsx'

describe('BlueprintForm', () => {
  it('envía el formulario con puntos parseados', () => {
    const onSubmit = vi.fn()
    render(<BlueprintForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/Autor/i), { target: { value: 'john' } })
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'house' } })
    fireEvent.change(screen.getByLabelText(/Puntos/i), {
      target: { value: '[{"x":1,"y":2}]' },
    })
    fireEvent.submit(screen.getByText(/Guardar/i))

    expect(onSubmit).toHaveBeenCalledWith({
      author: 'john',
      name: 'house',
      points: [{ x: 1, y: 2 }],
    })
  })

  it('con JSON inválido muestra el error y no envía', () => {
    const onSubmit = vi.fn()
    render(<BlueprintForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/Puntos/i), { target: { value: '[{x:1' } })
    fireEvent.submit(screen.getByText(/Guardar/i))

    expect(screen.getByRole('alert')).toHaveTextContent('JSON de puntos inválido')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('exige que los puntos sean un arreglo', () => {
    const onSubmit = vi.fn()
    render(<BlueprintForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/Puntos/i), { target: { value: '{"x":1,"y":2}' } })
    fireEvent.submit(screen.getByText(/Guardar/i))

    expect(screen.getByRole('alert')).toHaveTextContent(/arreglo/)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('mientras guarda deshabilita el botón', () => {
    render(<BlueprintForm onSubmit={vi.fn()} submitting />)
    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled()
  })
})

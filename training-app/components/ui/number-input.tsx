"use client"

import { useEffect, useRef, useState, type InputHTMLAttributes } from "react"

interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number
  onChange: (value: number) => void
}

/**
 * type="number" の入力を数値のstateに直接バインドすると、値が0のときに
 * 空にしても「空文字 -> Number('')=0」で変化がないと判定され、Reactが
 * 表示を強制的に "0" へ戻してしまう（空の状態で入力し続けられない）。
 * 入力中は入力文字列をそのまま表示し、focus中は外部からの値の同期を止め、
 * blur時に数値へ正規化することでこれを回避する。
 */
export function NumberInput({ value, onChange, ...props }: NumberInputProps) {
  const [text, setText] = useState(String(value))
  const isFocused = useRef(false)

  useEffect(() => {
    if (!isFocused.current) setText(String(value))
  }, [value])

  return (
    <input
      {...props}
      type="number"
      value={text}
      onFocus={(e) => {
        isFocused.current = true
        props.onFocus?.(e)
      }}
      onChange={(e) => {
        const raw = e.target.value
        setText(raw)
        if (raw.trim() === "") return
        const num = Number(raw)
        if (Number.isFinite(num)) onChange(num)
      }}
      onBlur={(e) => {
        isFocused.current = false
        const num = Number(text)
        setText(text.trim() === "" || !Number.isFinite(num) ? String(value) : String(num))
        props.onBlur?.(e)
      }}
    />
  )
}

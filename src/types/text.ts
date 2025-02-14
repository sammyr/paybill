export interface TextBlock {
  text: string
  x?: number
  y?: number
  fontSize?: number
  fontFamily?: string
  fontWeight?: number | string
  color?: string
  letterSpacing?: number
  lineHeight?: number
  textAlign?: 'left' | 'center' | 'right' | 'justify'
}

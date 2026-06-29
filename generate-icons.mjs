import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

function createIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#1a3a6e')
  gradient.addColorStop(1, '#2B7FFF')
  ctx.fillStyle = gradient
  ctx.roundRect(0, 0, size, size, size * 0.2)
  ctx.fill()
  
  ctx.fillStyle = '#D4A843'
  ctx.font = `bold ${size * 0.45}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('P', size * 0.5, size * 0.5)
  
  return canvas.toBuffer('image/png')
}

writeFileSync('public/icon-192.png', createIcon(192))
writeFileSync('public/icon-512.png', createIcon(512))
console.log('Icônes créées !')

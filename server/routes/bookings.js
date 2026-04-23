import { Router } from 'express'
const router = Router()

router.get('/',    (req, res) => res.json({ message: 'TODO' }))
router.get('/:id', (req, res) => res.json({ message: 'TODO' }))
router.post('/',   (req, res) => res.json({ message: 'TODO' }))
router.delete('/:id', (req, res) => res.json({ message: 'TODO' }))

export default router

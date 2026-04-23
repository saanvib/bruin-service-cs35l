import { Router } from 'express'
const router = Router()

router.get('/:id', (req, res) => res.json({ message: 'TODO' }))

export default router

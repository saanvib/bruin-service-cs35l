import { Router } from 'express'
const router = Router()

router.get('/listings',        (req, res) => res.json({ message: 'TODO' }))
router.post('/listings',       (req, res) => res.json({ message: 'TODO' }))
router.put('/listings/:id',    (req, res) => res.json({ message: 'TODO' }))
router.delete('/listings/:id', (req, res) => res.json({ message: 'TODO' }))

export default router

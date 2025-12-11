// routes/api.js
import express from 'express';
import ipApi from './ip_api.js';
import domainApi from './domain_api.js';
//import csrfApi from './csrf_api.js';

const router = express.Router();

router.use(ipApi);
router.use(domainApi);

export default router;

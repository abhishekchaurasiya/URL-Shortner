const express = require("express")
const router = express.Router();

const { urlShorten } = require("../controller/urlController")

router.post("/url/shorten", urlShorten)





module.exports = router;
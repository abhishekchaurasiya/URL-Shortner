const express = require("express")
const router = express.Router();

const { urlShorten, getUrlCode } = require("../controller/urlController")

router.post("/url/shorten", urlShorten);

router.get("/:urlCode", getUrlCode)



module.exports = router;
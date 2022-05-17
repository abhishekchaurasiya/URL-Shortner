
const urlModel = require('../model/urlModel');
const sortUlrId = require("shortid")

const { isValidRequestBody, isValidData, isValidUrl } = require("../utils/validator")

const urlShorten = async function (req, res) {
    try {

        let requestBody = req.body;

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "No data provided" })
        }

        const { longUrl } = requestBody;

        if (!isValidData(longUrl)) {
            return res.status(400).send({ status: false, message: "Long url is required" })
        }

        if (!isValidUrl.test(longUrl)) {
            return res.status(400).send({ status: false, message: "Long url invalid" })
        }

        // let findShortUrl = await urlModel.findOne({shortUrl})

        let urlCreate = await urlModel.create(requestBody);

        res.status(201).send({ status: true, data: urlCreate });


    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}





module.exports = { urlShorten }
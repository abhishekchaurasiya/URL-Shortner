
const urlModel = require('../model/urlModel');
const shortid = require('shortid');
const validUrl = require("valid-url");

let baseUrl = "http://localhost:3000";

const { isValidRequestBody, isValidData } = require("../utils/validator");

const urlShorten = async function (req, res) {
    try {

        let requestBody = req.body;

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "No data provided" })
        }

        if (!validUrl.isUri(baseUrl)) {
            return res.status(400).send({ status: false, message: "base url invalid" })
        }

        const shorIdCharacters = shortid.characters(('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@'))

        const urlCode = shortid.generate(shorIdCharacters);

        const { longUrl } = requestBody;

        if (!isValidData(longUrl)) {
            return res.status(400).send({ status: false, message: "Long url is required" })
        }

        if (!validUrl.isUri(longUrl)) {
            return res.status(400).send({ status: false, message: "Long url invalid" })
        }

        let findLongUrl = await urlModel.findOne({ longUrl });
        if (findLongUrl) {
            return res.status(400).send({ status: false, message: "This Url already exists" })
        }

        let shortUrl = baseUrl + "/" + urlCode;

        // http://localhost:3000/fsdoierlksdfo

        let url = {
            longUrl,
            shortUrl,
            urlCode
        }

        let urlCreate = await urlModel.create(url);
        res.status(201).send({ status: true, data: urlCreate });

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
};


let getUrlCode = async function (req, res) {
    try {
        let reqestParams = req.params.urlCode;

        let findUrlCode = await urlModel.findOne({ urlCode: reqestParams }).select({ urlCode: 1, longUrl: 1, shortUrl: 1 });
        if (!findUrlCode) {
            return res.status(404).send({ status: false, message: "Not found this url code." })
        }

        res.status(200).send({ status: true, data: findUrlCode })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}






module.exports = { urlShorten, getUrlCode }
const urlModel = require("../model/urlModel");
const shortid = require("shortid");
// const validUrl = require("valid-url");

const { isValidData, isValidRequestBody, validUrl } = require("../utils/validator")

const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
    13190,
    "redis-13190.c301.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("gkiOIPkytPI3ADi14jHMSWkZEo2J5TDG", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);



const urlShorten = async function (req, res) {
    try {

        let requestBody = req.body;

        const shorIdCharacters = shortid.characters(
            "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@");

        let urlCode = shortid.generate(shorIdCharacters);

        let baseUrl = "https://url-shortnering.herokuapp.com/";

        let shortUrl = baseUrl + "/" + urlCode;

        // http://localhost:3000/fsdoierlksdfo

        // Here starts validation
        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "No data provided" });
        }

        if (!validUrl.test(baseUrl)) {
            return res.status(400).send({ status: false, message: "base url invalid" });
        }


        const { longUrl } = requestBody;

        if (!isValidData(longUrl)) {
            return res.status(400).send({ status: false, message: "Long url is required" });
        }

        if (!validUrl.test(longUrl)) {
            return res.status(400).send({ status: false, message: "Long url is invalid" });
        }

        let cachesUrlData = await GET_ASYNC(`${req.body.longUrl}`);
        if (cachesUrlData) {
            return res.status(200).send({ status: true,  data: JSON.parse(cachesUrlData) })

        } else {

            let longUrlIsAlreadyUsed = await urlModel.findOne({ longUrl });
            if (longUrlIsAlreadyUsed) {
                return res.status(400).send({ status: false, message: "This Url already exists", LongUrl: longUrlIsAlreadyUsed });
            }


            let url = { longUrl, shortUrl, urlCode };

            let urlCreate = await urlModel.create(url);
            
            await SET_ASYNC(`${requestBody}`, JSON.stringify(urlCreate));

            res.status(201).send({ status: true, data: urlCreate });
        }

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
};

let getUrlCode = async function (req, res) {
    try {
        let requestParams = req.params.urlCode;

        let cachesUrlData = await GET_ASYNC(`${requestParams}`);

        //convert to object
        const urlData = JSON.parse(cachesUrlData);
        if (cachesUrlData) {
            return res.status(302).redirect(urlData.longUrl);
        } else {
            let findUrlCode = await urlModel.findOne({ urlCode: requestParams }).select({ urlCode: 1, longUrl: 1, shortUrl: 1 });

            if (!findUrlCode) {
                return res.status(404).send({ status: false, message: "Not found this url code." });
            }

            await SET_ASYNC(`${requestParams}`, JSON.stringify(findUrlCode));
            res.status(302).redirect(findUrlCode.longUrl);
        }
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
};

module.exports = { urlShorten, getUrlCode };

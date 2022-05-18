const urlModel = require("../model/urlModel");
const shortid = require("shortid");
const validUrl = require("valid-url");

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

let baseUrl = "http://localhost:3000";

const { isValidRequestBody, isValidData } = require("../utils/validator");

const urlShorten = async function (req, res) {
  try {
    let requestBody = req.body;

    if (!isValidRequestBody(requestBody)) {
      return res
        .status(400)
        .send({ status: false, message: "No data provided" });
    }

    if (!validUrl.isUri(baseUrl)) {
      return res
        .status(400)
        .send({ status: false, message: "base url invalid" });
    }

    const shorIdCharacters = shortid.characters(
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@"
    );

    const urlCode = shortid.generate(shorIdCharacters);

    const { longUrl } = requestBody;

    if (!isValidData(longUrl)) {
      return res
        .status(400)
        .send({ status: false, message: "Long url is required" });
    }

    if (!validUrl.isUri(longUrl)) {
      return res
        .status(400)
        .send({ status: false, message: "Long url invalid" });
    }

    let longUrlIsAlreadyUsed = await urlModel.findOne({ longUrl });
    if (longUrlIsAlreadyUsed) {
      return res
        .status(400)
        .send({ status: false, message: "This Url already exists" });
    }

    let shortUrl = baseUrl + "/" + urlCode;

    // http://localhost:3000/fsdoierlksdfo

    let url = { longUrl, shortUrl, urlCode };

    let urlCreate = await urlModel.create(url);
    res.status(201).send({ status: true, data: urlCreate });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

let getUrlCode = async function (req, res) {
  try {
    let requestParams = req.params.urlCode;

    let cachesUrlData = await GET_ASYNC(`${requestParams}`);
    console.log(cachesUrlData)
    const test = JSON.parse(cachesUrlData);
    console.log(test);
    if (cachesUrlData) {
      console.log("cache");
      return res.status(200).redirect(test.longUrl);
    } else {
      let findUrlCode = await urlModel
        .findOne({ urlCode: requestParams })
        .select({ urlCode: 1, longUrl: 1, shortUrl: 1 });

      // res.redirect(findUrlCode.longUrl)
      await SET_ASYNC(`${requestParams}`, JSON.stringify(findUrlCode));

      if (!findUrlCode) {
        return res
          .status(404)
          .send({ status: false, message: "Not found this url code." });
      }
      // res.status(200).send({ status: true, data: findUrlCode })
    }
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = { urlShorten, getUrlCode };

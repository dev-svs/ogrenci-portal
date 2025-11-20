const express = require("express");
const router = express.Router();

const { getRecommendations } = require("../controllers/ai.controller");

router.post("/recommendations", getRecommendations);

module.exports = router;

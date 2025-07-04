const express = require("express");
const router = express.Router();
const { createSpace } = require("../controllers/spacecontroller");
const authMiddleware = require("../middleware/authmiddleware");
const { getMySpaces } = require("../controllers/spacecontroller");
const { getSpaceById } = require("../controllers/spacecontroller");
const { updateSpace } = require("../controllers/spacecontroller");

router.post("/create", authMiddleware, createSpace);

router.get('/myspace', authMiddleware, getMySpaces);

router.get("/:id", authMiddleware, getSpaceById );

router.put("/update/:id", authMiddleware, updateSpace);

module.exports = router;

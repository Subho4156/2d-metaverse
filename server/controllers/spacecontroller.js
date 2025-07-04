const Space = require("../models/Space");

exports.createSpace = async (req, res) => {
  try {
    const { name, description } = req.body;
    const creator = req.userId; 

    const space = new Space({
      name,
      description,
      creator,
      users: [creator]
    });

    await space.save();
    res.status(201).json({ message: "Space created", space });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create space" });
  }
};

exports.getMySpaces = async (req, res) => {
  try {
    const userId = req.userId;
    const spaces = await Space.find({ creator: userId }); // ✅ Must be 'creator'
    res.status(200).json({ spaces });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch spaces", error: err.message });
  }
};

exports.getSpaceById = async (req, res) => {
  try {
    const spaceId = req.params.id;
    const space = await Space.findById(spaceId);

    if (!space) {
      return res.status(404).json({ message: "Space not found" });
    }

    res.status(200).json({ space }); 
  } catch (err) {
    res.status(500).json({ message: "Failed to load space", error: err.message });
  }
};

exports.updateSpace = async (req, res) => {
   try {
    const { name, description } = req.body;
    const space = await Space.findById(req.params.id);

    if (!space) return res.status(404).json({ error: "Space not found" });

    space.name = name || space.name;
    space.description = description || space.description;

    await space.save();
    res.status(200).json(space);
  } catch (err) {
    res.status(500).json({ error: "Failed to update space" });
  }
}

